const express = require('express');
const router = express.Router();
const db = require('../config/database');

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
      // Redireciona para veicular.get
      const veicular = require('./veicular');
      return veicular.get(req, res);
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
      // Redireciona para veicular.set
      const veicular = require('./veicular');
      return veicular.set(req, res);
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
  try {
    const acao = req.query.acao || 'todos';

    switch (acao) {
      case 'id':
        if (!req.query.id) {
          return res.status(400).json({ erro: 'ID não informado' });
        }

        const resultado = await db.queryOne(
          `SELECT c.*, u.nome as usuario_nome
           FROM checklist_checklist_completo c
           LEFT JOIN checklist_usuario u ON c.usuario_id = u.id
           WHERE c.id = ?`,
          [req.query.id]
        );

        if (!resultado) {
          return res.status(404).json({ erro: 'Checklist não encontrado' });
        }

        // Decodifica campos JSON
        resultado.parte1 = resultado.parte1_interna ? JSON.parse(resultado.parte1_interna) : {};
        resultado.parte2 = resultado.parte2_externa ? JSON.parse(resultado.parte2_externa) : {};
        resultado.parte3 = resultado.parte3_acessorios ? JSON.parse(resultado.parte3_acessorios) : {};
        resultado.parte4 = resultado.parte4_lataria ? JSON.parse(resultado.parte4_lataria) : {};
        resultado.parte5 = resultado.parte5_especial ? JSON.parse(resultado.parte5_especial) : {};

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
           FROM checklist_checklist_completo c
           LEFT JOIN checklist_usuario u ON c.usuario_id = u.id
           ORDER BY c.data_realizacao DESC
           LIMIT ?`,
          [limite]
        );

        res.json(todos);
        break;

      case 'placa':
        if (!req.query.placa) {
          return res.status(400).json({ erro: 'Placa não informada' });
        }

        const checklists = await db.query(
          `SELECT c.*, u.nome as usuario_nome
           FROM checklist_checklist_completo c
           LEFT JOIN checklist_usuario u ON c.usuario_id = u.id
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
           FROM checklist_checklist_completo c
           LEFT JOIN checklist_usuario u ON c.usuario_id = u.id
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
         FROM checklist_checklist_completo
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
      `INSERT INTO checklist_checklist_completo 
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
