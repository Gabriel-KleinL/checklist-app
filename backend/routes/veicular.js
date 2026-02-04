const express = require('express');
const router = express.Router();
const db = require('../config/database');
const FotoUtils = require('../utils/FotoUtils');

function converterNivelCombustivel(valor) {
  const mapa = {
    'vazio': '0%', '1/4': '25%', '1/2': '50%', '3/4': '75%', 'cheio': '100%',
    '0%': '0%', '25%': '25%', '50%': '50%', '75%': '75%', '100%': '100%'
  };
  return mapa[valor] || '0%';
}

router.post('/set', async (req, res) => {
  const dados = req.body;
  console.log('=== REQUISIÇÃO RECEBIDA ===');
  if (!dados) return res.status(400).json({ erro: 'Dados inválidos' });

  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    const nivelCombustivelConvertido = converterNivelCombustivel(dados.nivel_combustivel || 'vazio');
    let usuarioId = dados.usuario_id || null;

    if (!usuarioId) {
      const [usuarios] = await connection.query(
        `SELECT id FROM ${db.table('usuario')} WHERE ativo = 1 AND id != 1 LIMIT 1`
      );
      usuarioId = usuarios.length > 0 ? usuarios[0].id : 1;
    }

    const local = dados.local || null;
    let dataRealizacao = dados.data_realizacao || new Date();
    if (typeof dataRealizacao === 'string' && dataRealizacao.includes('T')) {
      dataRealizacao = new Date(dataRealizacao);
    }
    const tipoVeiculoId = dados.tipo_veiculo_id || 1;

    const dadosInspecao = JSON.stringify({
      local: local,
      placa: dados.placa || '',
      km_inicial: dados.km_inicial || 0,
      nivel_combustivel: nivelCombustivelConvertido,
      observacao_painel: dados.observacao_painel || '',
      status_geral: 'PENDENTE'
    });

    const [resultado] = await connection.query(
      `INSERT INTO ${db.table('inspecao_veiculo')} (dados_inspecao, data_realizacao, usuario_id, tipo_veiculo_id) VALUES (?, ?, ?, ?)`,
      [dadosInspecao, dataRealizacao, usuarioId, tipoVeiculoId]
    );

    const inspecaoId = resultado.insertId;
    console.log('Inspeção criada com ID:', inspecaoId);

    const fotos = { 'foto_painel': 'PAINEL', 'foto_frontal': 'FRONTAL', 'foto_traseira': 'TRASEIRA', 'foto_lateral_direita': 'LATERAL_DIREITA', 'foto_lateral_esquerda': 'LATERAL_ESQUERDA' };
    for (const [campo, tipo] of Object.entries(fotos)) {
      if (dados[campo]) {
        let fotoPath = dados[campo];
        if (FotoUtils.isBase64(fotoPath)) {
          fotoPath = FotoUtils.save(
            fotoPath,
            inspecaoId,
            `inspecao_${tipo.toLowerCase()}`
          );
        }
        await connection.query(
          `INSERT INTO ${db.table('inspecao_foto')} (inspecao_id, tipo, foto) VALUES (?, ?, ?)`,
          [inspecaoId, tipo, fotoPath]
        );
      }
    }

    if (dados.itens_inspecao && Array.isArray(dados.itens_inspecao)) {
      for (const item of dados.itens_inspecao) {
        if (item.status) {
          let fotoPath = item.foto || null;
          if (fotoPath && FotoUtils.isBase64(fotoPath)) {
            fotoPath = FotoUtils.save(fotoPath, inspecaoId, `item_${item.item.replace(/\s/g, '_')}`);
          }
          await connection.query(`INSERT INTO ${db.table('inspecao_item')} (inspecao_id, categoria, item, status, foto, pressao, foto_caneta, descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [inspecaoId, item.categoria, item.item, item.status, fotoPath, null, null, item.descricao || null]);
        }
      }
    }

    if (dados.itens_pneus && Array.isArray(dados.itens_pneus)) {
      for (const pneu of dados.itens_pneus) {
        if (pneu.status) {
          let fotoPath = pneu.foto || null;
          let fotoCanetaPath = pneu.foto_caneta || null;
          const subItemSuffix = pneu.sub_item ? `_${pneu.sub_item.replace(/\s/g, '_')}` : '';
          if (fotoPath && FotoUtils.isBase64(fotoPath)) {
            fotoPath = FotoUtils.save(fotoPath, inspecaoId, `pneu_${pneu.item.replace(/\s/g, '_')}${subItemSuffix}`);
          }
          if (fotoCanetaPath && FotoUtils.isBase64(fotoCanetaPath)) {
            fotoCanetaPath = FotoUtils.save(fotoCanetaPath, inspecaoId, `pneu_caneta_${pneu.item.replace(/\s/g, '_')}${subItemSuffix}`);
          }
          await connection.query(`INSERT INTO ${db.table('inspecao_item')} (inspecao_id, categoria, item, sub_item, status, foto, pressao, foto_caneta, descricao) VALUES (?, 'PNEU', ?, ?, ?, ?, ?, ?, ?)`, [inspecaoId, pneu.item, pneu.sub_item || null, pneu.status, fotoPath, pneu.pressao || null, fotoCanetaPath, pneu.descricao || null]);
        }
      }
    }

    await connection.commit();
    res.status(201).json({ sucesso: true, mensagem: 'Checklist salvo com sucesso', id: inspecaoId });
    console.log('=== CHECKLIST SALVO - ID:', inspecaoId, '===');
  } catch (error) {
    await connection.rollback();
    console.error('');
    console.error('❌ ERRO VEICULAR SET:');
    console.error('  Placa:', dados.placa || 'não informada');
    console.error('  Mensagem:', error.message);
    console.error('  Stack:', error.stack);
    console.error('');
    res.status(500).json({ erro: 'Erro ao salvar checklist', detalhes: error.message });
  } finally {
    connection.release();
  }
});

/**
 * Atualiza uma inspeção (insere fotos e itens adicionais)
 * Compatível com b_veicular_update.php
 */
router.post('/update', async (req, res) => {
  const dados = req.body;
  if (!dados || !dados.inspecao_id) {
    return res.status(400).json({ erro: 'Dados inválidos ou inspecao_id não informado' });
  }

  const inspecaoId = dados.inspecao_id;
  const connection = await db.pool.getConnection();

  try {
    // Verifica se existe
    const [existe] = await connection.query(
      `SELECT id FROM ${db.table('inspecao_veiculo')} WHERE id = ?`,
      [inspecaoId]
    );
    if (!existe || existe.length === 0) {
      connection.release();
      return res.status(404).json({ erro: 'Inspeção não encontrada' });
    }

    await connection.beginTransaction();

    // Fotos adicionais
    if (dados.fotos && Array.isArray(dados.fotos)) {
      for (const foto of dados.fotos) {
        if (foto?.tipo && foto?.foto) {
          let fotoPath = foto.foto;
          if (FotoUtils.isBase64(fotoPath)) {
            fotoPath = FotoUtils.save(fotoPath, inspecaoId, `update_${foto.tipo.toLowerCase()}`);
          }
          await connection.query(
            `INSERT INTO ${db.table('inspecao_foto')} (inspecao_id, tipo, foto) VALUES (?, ?, ?)`,
            [inspecaoId, foto.tipo, fotoPath]
          );
        }
      }
    }

    // Itens de inspeção adicionais
    if (dados.itens_inspecao && Array.isArray(dados.itens_inspecao)) {
      for (const item of dados.itens_inspecao) {
        if (item.status) {
          let fotoPath = item.foto || null;
          if (fotoPath && FotoUtils.isBase64(fotoPath)) {
            fotoPath = FotoUtils.save(fotoPath, inspecaoId, `item_${item.item.replace(/\s/g, '_')}`);
          }
          await connection.query(
            `INSERT INTO ${db.table('inspecao_item')} (inspecao_id, categoria, item, status, foto, pressao, foto_caneta, descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [inspecaoId, item.categoria, item.item, item.status, fotoPath, null, null, item.descricao || null]
          );
        }
      }
    }

    // Itens de pneus adicionais
    if (dados.itens_pneus && Array.isArray(dados.itens_pneus)) {
      for (const pneu of dados.itens_pneus) {
        if (pneu.status) {
          let fotoPath = pneu.foto || null;
          let fotoCanetaPath = pneu.foto_caneta || null;
          const subItemSuffix = pneu.sub_item ? `_${pneu.sub_item.replace(/\s/g, '_')}` : '';
          if (fotoPath && FotoUtils.isBase64(fotoPath)) {
            fotoPath = FotoUtils.save(fotoPath, inspecaoId, `pneu_${pneu.item.replace(/\s/g, '_')}${subItemSuffix}`);
          }
          if (fotoCanetaPath && FotoUtils.isBase64(fotoCanetaPath)) {
            fotoCanetaPath = FotoUtils.save(fotoCanetaPath, inspecaoId, `pneu_caneta_${pneu.item.replace(/\s/g, '_')}${subItemSuffix}`);
          }
          await connection.query(
            `INSERT INTO ${db.table('inspecao_item')} (inspecao_id, categoria, item, sub_item, status, foto, pressao, foto_caneta, descricao) VALUES (?, 'PNEU', ?, ?, ?, ?, ?, ?, ?)`,
            [inspecaoId, pneu.item, pneu.sub_item || null, pneu.status, fotoPath, pneu.pressao || null, fotoCanetaPath, pneu.descricao || null]
          );
        }
      }
    }

    // Observação adicional (salva no JSON dados_inspecao)
    if (dados.observacao_adicional !== undefined) {
      await connection.query(
        `UPDATE ${db.table('inspecao_veiculo')}
         SET dados_inspecao = JSON_SET(COALESCE(dados_inspecao, '{}'), '$.observacao_adicional', ?)
         WHERE id = ?`,
        [dados.observacao_adicional, inspecaoId]
      );
    }

    await connection.commit();
    res.json({ sucesso: true, mensagem: 'Inspeção atualizada com sucesso', id: inspecaoId });
  } catch (error) {
    if (connection.inTransaction) await connection.rollback();
    console.error('');
    console.error('❌ ERRO VEICULAR UPDATE:');
    console.error('  Inspeção ID:', inspecaoId);
    console.error('  Mensagem:', error.message);
    console.error('  Stack:', error.stack);
    console.error('');
    res.status(500).json({ erro: 'Erro ao atualizar inspeção', detalhes: error.message });
  } finally {
    connection.release();
  }
});

router.get('/get', async (req, res) => {
  const acao = req.query.acao || 'todos';
  console.log('📋 VEICULAR GET - Ação:', acao, '| Query:', req.query);
  
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
        
        // Converter caminhos de fotos para URLs
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
        if (!req.query.placa) {
          console.error('❌ ERRO: Placa não informada na busca');
          return res.status(400).json({ erro: 'Placa não informada' });
        }
        const placaBusca = req.query.placa.trim();
        console.log('  🔍 Buscando por placa:', placaBusca);
        const sqlPlaca = `SELECT i.*, u.nome as usuario_nome FROM ${db.table('inspecao_veiculo')} i LEFT JOIN ${db.table('usuario')} u ON i.usuario_id = u.id WHERE i.placa LIKE ? ORDER BY i.data_realizacao DESC LIMIT 100`;
        const paramsPlaca = [`%${placaBusca}%`];
        console.log('  SQL:', sqlPlaca);
        console.log('  Params:', paramsPlaca);
        const [inspecoesPorPlaca] = await connection.query(sqlPlaca, paramsPlaca);
        connection.release();
        console.log('  ✅ Encontradas', inspecoesPorPlaca.length, 'inspeções para placa', placaBusca);
        if (inspecoesPorPlaca.length === 0) {
          console.log('  ⚠️  Nenhuma inspeção encontrada para a placa:', placaBusca);
        }
        res.json(inspecoesPorPlaca);
        break;
      case 'validar_placa':
        if (!req.query.placa) {
          console.error('❌ ERRO: Placa não informada na validação');
          return res.status(400).json({ 
            sucesso: false, 
            erro: 'Placa não informada',
            dados: false 
          });
        }
        const placaValidar = req.query.placa.trim().toUpperCase();
        console.log('  ✅ Validando placa:', placaValidar);
        
        // Verifica se a placa existe na tabela Vehicles
        const [veiculo] = await connection.query(
          `SELECT LicensePlate FROM Vehicles WHERE UPPER(LicensePlate) = ? LIMIT 1`,
          [placaValidar]
        );
        connection.release();
        
        const placaExiste = veiculo.length > 0;
        console.log('  Resultado:', placaExiste ? '✅ Placa encontrada' : '❌ Placa não encontrada');
        
        res.json({
          sucesso: true,
          dados: placaExiste,
          mensagem: placaExiste ? 'Placa encontrada' : 'Placa não encontrada'
        });
        break;
      case 'completo':
        if (!req.query.id) {
          connection.release();
          return res.status(400).json({ erro: 'ID não informado' });
        }
        console.log('  🔍 Buscando checklist completo ID:', req.query.id);
        
        // Busca a inspeção com informações do usuário
        const [inspecaoCompleto] = await connection.query(
          `SELECT i.*, u.nome as usuario_nome, u.id as usuario_id
           FROM ${db.table('inspecao_veiculo')} i
           LEFT JOIN ${db.table('usuario')} u ON i.usuario_id = u.id
           WHERE i.id = ?`,
          [req.query.id]
        );
        
        if (inspecaoCompleto.length === 0) {
          connection.release();
          return res.status(404).json({ erro: 'Inspeção não encontrada' });
        }
        
        const inspecaoData = inspecaoCompleto[0];
        
        // Busca fotos
        const [fotosCompleto] = await connection.query(
          `SELECT * FROM ${db.table('inspecao_foto')} WHERE inspecao_id = ?`,
          [req.query.id]
        );
        
        // Organiza fotos por tipo
        const fotosPorTipo = {};
        fotosCompleto.forEach(foto => {
          fotosPorTipo[foto.tipo] = FotoUtils.getUrl(foto.foto);
        });
        
        // Busca itens
        const [itensCompleto] = await connection.query(
          `SELECT * FROM ${db.table('inspecao_item')} WHERE inspecao_id = ?`,
          [req.query.id]
        );
        
        // Organiza itens por categoria
        const itensPorCategoria = {};
        itensCompleto.forEach(item => {
          if (!itensPorCategoria[item.categoria]) {
            itensPorCategoria[item.categoria] = [];
          }
          itensPorCategoria[item.categoria].push({
            ...item,
            foto: item.foto ? FotoUtils.getUrl(item.foto) : null,
            foto_caneta: item.foto_caneta ? FotoUtils.getUrl(item.foto_caneta) : null
          });
        });
        
        connection.release();

        // Agrupa itens PNEU por posição (item) com sub-itens (sub_item)
        if (itensPorCategoria['PNEU']) {
          const pneusPorPosicao = {};
          itensPorCategoria['PNEU'].forEach(item => {
            const posicao = item.item;
            if (!pneusPorPosicao[posicao]) {
              pneusPorPosicao[posicao] = { posicao, pressao: null, regras: [] };
            }
            if (item.sub_item) {
              pneusPorPosicao[posicao].regras.push(item);
            } else {
              // Dados legados (sem sub_item) ou linha de pressão
              if (item.pressao) {
                pneusPorPosicao[posicao].pressao = item.pressao;
              }
              if (item.status) {
                pneusPorPosicao[posicao].regras.push(item);
              }
            }
          });
          itensPorCategoria['PNEU_AGRUPADO'] = Object.values(pneusPorPosicao);
        }

        // Extrai campos do JSON dados_inspecao
        const dadosInspecao = typeof inspecaoData.dados_inspecao === 'string'
          ? JSON.parse(inspecaoData.dados_inspecao)
          : (inspecaoData.dados_inspecao || {});

        // Monta resposta completa
        const respostaCompleta = {
          ...inspecaoData,
          local: dadosInspecao.local || null,
          km_inicial: dadosInspecao.km_inicial || null,
          nivel_combustivel: dadosInspecao.nivel_combustivel || null,
          status_geral: dadosInspecao.status_geral || null,
          observacao_painel: dadosInspecao.observacao_painel || null,
          observacao_adicional: dadosInspecao.observacao_adicional || null,
          usuario: inspecaoData.usuario_nome ? {
            id: inspecaoData.usuario_id,
            nome: inspecaoData.usuario_nome
          } : null,
          fotos: fotosPorTipo,
          itens: itensPorCategoria
        };
        
        console.log('  ✅ Checklist completo retornado para ID:', req.query.id);
        res.json(respostaCompleta);
        break;
      default:
        const limite = parseInt(req.query.limite) || 100;
        const [todasInspecoes] = await connection.query(`SELECT i.*, JSON_UNQUOTE(JSON_EXTRACT(i.dados_inspecao, '$.local')) as local, u.nome as usuario_nome FROM ${db.table('inspecao_veiculo')} i LEFT JOIN ${db.table('usuario')} u ON i.usuario_id = u.id ORDER BY i.data_realizacao DESC LIMIT ?`, [limite]);
        connection.release();
        res.json(todasInspecoes);
    }
  } catch (error) {
    console.error('');
    console.error('❌ ERRO VEICULAR GET:');
    console.error('  Ação:', acao);
    console.error('  Query:', req.query);
    console.error('  Mensagem:', error.message);
    console.error('  Stack:', error.stack);
    console.error('');
    res.status(500).json({ erro: 'Erro ao buscar inspeções', detalhes: error.message });
  }
});

module.exports = router;
