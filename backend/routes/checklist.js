const express = require('express');
const router = express.Router();
const db = require('../config/database');
const FotoUtils = require('../utils/FotoUtils');

/**
 * Handler para veicular.get (reutilizado)
 */
async function veicularGetHandler(req, res) {
  const acao = req.query.acao || 'todos';
  try {
    const connection = await db.pool.getConnection();
    switch (acao) {
      case 'id':
        if (!req.query.id) return res.status(400).json({ erro: 'ID não informado' });
        const [inspecao] = await connection.query(
          `SELECT i.*, u.nome as usuario_nome
           FROM ${db.table('inspecao_veiculo')} i
           LEFT JOIN ${db.table('usuario')} u ON i.usuario_id = u.id
           WHERE i.id = ?`,
          [req.query.id]
        );
        if (inspecao.length === 0) {
          connection.release();
          return res.status(404).json({ erro: 'Inspeção não encontrada' });
        }
        const [fotos] = await connection.query(
          `SELECT * FROM ${db.table('inspecao_foto')} WHERE inspecao_id = ?`,
          [req.query.id]
        );
        const [itens] = await connection.query(
          `SELECT * FROM ${db.table('inspecao_item')} WHERE inspecao_id = ?`,
          [req.query.id]
        );
        connection.release();
        const fotosComUrl = fotos.map(foto => ({
          ...foto,
          foto: FotoUtils.getUrl(foto.foto)
        }));
        const itensComUrl = itens.map(item => ({
          ...item,
          foto: FotoUtils.getUrl(item.foto),
          foto_caneta: FotoUtils.getUrl(item.foto_caneta)
        }));
        res.json({ ...inspecao[0], fotos: fotosComUrl, itens: itensComUrl });
        break;
      case 'placa':
        if (!req.query.placa) return res.status(400).json({ erro: 'Placa não informada' });
        const [inspecoesPorPlaca] = await connection.query(`SELECT i.*, u.nome as usuario_nome FROM ${db.table('inspecao_veiculo')} i LEFT JOIN ${db.table('usuario')} u ON i.usuario_id = u.id WHERE i.placa LIKE ? ORDER BY i.data_realizacao DESC LIMIT 100`, [`%${req.query.placa}%`]);
        connection.release();
        res.json(inspecoesPorPlaca);
        break;
      default:
        const limite = parseInt(req.query.limite) || 100;
        const [todasInspecoes] = await connection.query(`SELECT i.*, u.nome as usuario_nome FROM ${db.table('inspecao_veiculo')} i LEFT JOIN ${db.table('usuario')} u ON i.usuario_id = u.id ORDER BY i.data_realizacao DESC LIMIT ?`, [limite]);
        connection.release();
        res.json(todasInspecoes);
    }
  } catch (error) {
    console.error('ERRO:', error.message);
    res.status(500).json({ erro: 'Erro ao buscar inspeções', detalhes: error.message });
  }
}

/**
 * GET /b_checklist_get.php (unificado - suporta tipo=simples ou tipo=completo)
 */
async function get(req, res) {
  try {
    const tipo = req.query.tipo || 'simples';

    // Validar tipo
    if (!['simples', 'completo'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo inválido. Use: simples ou completo' });
    }

    if (tipo === 'simples') {
      // Redireciona para veicular.get - chama diretamente o handler
      return veicularGetHandler(req, res);
    } else {
      // Usa getCompleto
      return getCompleto(req, res);
    }
  } catch (error) {
    console.error('Erro em checklist.get:', error);
    res.status(500).json({
      erro: 'Erro ao buscar checklist',
      detalhes: error.message
    });
  }
}

/**
 * POST /b_checklist_set.php (unificado - detecta automaticamente)
 */
async function set(req, res) {
  try {
    const dados = req.body;
    
    if (!dados) {
      return res.status(400).json({ erro: 'Dados inválidos' });
    }

    // Detecta o tipo de checklist
    const tipo = detectarTipoChecklist(dados);

    if (tipo === 'simples') {
      // Redireciona para veicular.set usando o router
      const veicularRouter = require('./veicular');
      const tempReq = Object.create(req);
      tempReq.url = '/set';
      tempReq.path = '/set';
      tempReq.method = 'POST';
      tempReq.body = req.body;
      tempReq.query = req.query;
      return veicularRouter.handle(tempReq, res, () => {});
    } else {
      // Usa setCompleto
      return setCompleto(req, res);
    }
  } catch (error) {
    console.error('Erro em checklist.set:', error);
    res.status(500).json({
      erro: 'Erro ao salvar checklist',
      detalhes: error.message
    });
  }
}

/**
 * Detecta o tipo de checklist baseado nos dados
 */
function detectarTipoChecklist(dados) {
  // Se o tipo está explícito, usa ele
  if (dados.tipo) {
    return dados.tipo;
  }

  // Detecta por estrutura: checklist completo tem parte1, parte2, etc
  if (dados.parte1 || dados.parte2 || dados.parte1_interna || dados.inspecaoInicial) {
    return 'completo';
  }

  // Detecta por estrutura: checklist simples tem itens_inspecao e itens_pneus
  if (dados.itens_inspecao || dados.itens_pneus) {
    return 'simples';
  }

  // Padrão: simples
  return 'simples';
}

/**
 * GET /b_checklist_completo_get.php
 */
async function getCompleto(req, res) {
  // Faz parse seguro de JSON, aceita string ou objeto já parseado
  function safeParseJson(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return {};
    try {
      return JSON.parse(value);
    } catch (e) {
      return {};
    }
  }

  try {
    const acao = req.query.acao || 'todos';

    switch (acao) {
      case 'id':
        if (!req.query.id) {
          return res.status(400).json({ erro: 'ID não informado' });
        }

        const resultado = await db.queryOne(
          `SELECT c.*, u.nome as usuario_nome
           FROM ${db.table('completo')} c
           LEFT JOIN ${db.table('usuario')} u ON c.usuario_id = u.id
           WHERE c.id = ?`,
          [req.query.id]
        );

        if (!resultado) {
          return res.status(404).json({ erro: 'Checklist não encontrado' });
        }

        // Decodifica campos JSON com fallback seguro
        resultado.parte1 = safeParseJson(resultado.parte1_interna);
        resultado.parte2 = safeParseJson(resultado.parte2_externa);
        resultado.parte3 = safeParseJson(resultado.parte3_acessorios);
        resultado.parte4 = safeParseJson(resultado.parte4_lataria);
        resultado.parte5 = safeParseJson(resultado.parte5_especial);

        delete resultado.parte1_interna;
        delete resultado.parte2_externa;
        delete resultado.parte3_acessorios;
        delete resultado.parte4_lataria;
        delete resultado.parte5_especial;

        res.json(resultado);
        break;

      case 'todos':
      default:
        const limite = parseInt(req.query.limite) || 100;

        const todos = await db.query(
          `SELECT c.*, u.nome as usuario_nome
           FROM ${db.table('completo')} c
           LEFT JOIN ${db.table('usuario')} u ON c.usuario_id = u.id
           ORDER BY c.data_realizacao DESC
           LIMIT ${limite}`
        );

        res.json(todos);
        break;

      case 'placa':
        if (!req.query.placa) {
          return res.status(400).json({ erro: 'Placa não informada' });
        }

        const checklists = await db.query(
          `SELECT c.*, u.nome as usuario_nome
           FROM ${db.table('completo')} c
           LEFT JOIN ${db.table('usuario')} u ON c.usuario_id = u.id
           WHERE c.placa = ?
           ORDER BY c.data_realizacao DESC`,
          [req.query.placa]
        );

        res.json(checklists);
        break;

      case 'periodo':
        if (!req.query.data_inicio || !req.query.data_fim) {
          return res.status(400).json({ erro: 'Datas não informadas' });
        }

        const checklistsPeriodo = await db.query(
          `SELECT c.*, u.nome as usuario_nome
           FROM ${db.table('completo')} c
           LEFT JOIN ${db.table('usuario')} u ON c.usuario_id = u.id
           WHERE c.data_realizacao BETWEEN ? AND ?
           ORDER BY c.data_realizacao DESC`,
          [req.query.data_inicio, req.query.data_fim]
        );

        res.json(checklistsPeriodo);
        break;
    }
  } catch (error) {
    console.error('Erro em checklist.getCompleto:', error);
    res.status(500).json({
      erro: 'Erro ao buscar checklist completo',
      detalhes: error.message
    });
  }
}

/**
 * POST /b_checklist_completo_set.php
 */
async function setCompleto(req, res) {
  const connection = await db.getPool().getConnection();
  
  try {
    await connection.beginTransaction();

    const dados = req.body;

    if (!dados) {
      return res.status(400).json({ erro: 'Dados inválidos' });
    }

    // Validação: verifica se já existe registro da mesma placa nas últimas 1 hora
    const placaParaValidar = dados.placa ? dados.placa.toUpperCase().trim() : '';

    if (placaParaValidar) {
      const [registroRecente] = await connection.execute(
        `SELECT id, data_realizacao
         FROM ${db.table('completo')}
         WHERE placa = ?
         AND data_realizacao >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
         ORDER BY data_realizacao DESC
         LIMIT 1`,
        [placaParaValidar]
      );

      if (registroRecente.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          erro: 'Registro duplicado',
          mensagem: `A placa ${placaParaValidar} já possui um registro nas últimas 1 hora. Aguarde antes de registrar novamente.`,
          ultimo_registro: registroRecente[0].data_realizacao
        });
      }
    }

    // Função auxiliar: converte nível de combustível
    function converterNivelCombustivel(valor) {
      const mapa = {
        'vazio': '0%',
        'Vazio': '0%',
        '1/4': '25%',
        '1/2': '50%',
        '3/4': '75%',
        'cheio': '100%',
        'Cheio': '100%',
        '0%': '0%',
        '25%': '25%',
        '50%': '50%',
        '75%': '75%',
        '100%': '100%'
      };
      return mapa[valor] || '0%';
    }

    // Processa data de realização
    let dataRealizacao = dados.data_realizacao || new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (dataRealizacao.includes('T')) {
      dataRealizacao = new Date(dataRealizacao).toISOString().slice(0, 19).replace('T', ' ');
    }

    // Converte nível de combustível
    const nivelCombustivelOriginal = dados.nivel_combustivel || 'vazio';
    const nivelCombustivelConvertido = converterNivelCombustivel(nivelCombustivelOriginal);

    // Usuário ID
    let usuarioId = dados.usuario_id || null;
    if (usuarioId === null) {
      const [usuarioPadrao] = await connection.execute(
        'SELECT id FROM checklist_usuario WHERE ativo = 1 AND id != 1 ORDER BY id LIMIT 1'
      );
      usuarioId = usuarioPadrao.length > 0 ? usuarioPadrao[0].id : 1;
    }

    // Prepara dados das partes (JSON)
    const parte1 = dados.parte1 || dados.inspecaoInicial || {};
    const parte2 = dados.parte2 || dados.inspecaoVeiculo?.parte2_externa || {};
    const parte3 = dados.parte3 || dados.inspecaoVeiculo?.parte3_acessorios || {};
    const parte4 = dados.parte4 || dados.inspecaoVeiculo?.parte4_lataria || {};
    const parte5 = dados.parte5 || dados.inspecaoVeiculo?.parte5_especial || {};

    // Insere checklist completo
    const [result] = await connection.execute(
      `INSERT INTO ${db.table('completo')} 
       (placa, km_inicial, nivel_combustivel, foto_painel, observacao_painel,
        parte1_interna, parte2_externa, parte3_acessorios, parte4_lataria, parte5_especial,
        usuario_id, data_realizacao, tipo_veiculo_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completo')`,
      [
        dados.placa || '',
        dados.km_inicial || 0,
        nivelCombustivelConvertido,
        dados.foto_painel || null,
        dados.observacao_painel || '',
        JSON.stringify(parte1),
        JSON.stringify(parte2),
        JSON.stringify(parte3),
        JSON.stringify(parte4),
        JSON.stringify(parte5),
        usuarioId,
        dataRealizacao,
        dados.tipo_veiculo_id || 1
      ]
    );

    const checklistId = result.insertId;

    await connection.commit();

    res.status(201).json({
      sucesso: true,
      mensagem: 'Checklist completo salvo com sucesso',
      id: checklistId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro em checklist.setCompleto:', error);
    res.status(500).json({
      erro: 'Erro ao salvar checklist completo',
      detalhes: error.message
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  get,
  set,
  getCompleto,
  setCompleto
};
