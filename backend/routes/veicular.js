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
      const [usuarios] = await connection.query('SELECT id FROM bbb_usuario WHERE ativo = 1 AND id != 1 LIMIT 1');
      usuarioId = usuarios.length > 0 ? usuarios[0].id : 1;
    }

    const local = dados.local || null;
    let dataRealizacao = dados.data_realizacao || new Date();
    if (typeof dataRealizacao === 'string' && dataRealizacao.includes('T')) {
      dataRealizacao = new Date(dataRealizacao);
    }
    const tipoVeiculoId = dados.tipo_veiculo_id || 1;

    const [resultado] = await connection.query(
      `INSERT INTO bbb_inspecao_veiculo (placa, local, data_realizacao, km_inicial, nivel_combustivel, observacao_painel, usuario_id, status_geral, tipo_veiculo_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?)`,
      [dados.placa || '', local, dataRealizacao, dados.km_inicial || 0, nivelCombustivelConvertido, dados.observacao_painel || '', usuarioId, tipoVeiculoId]
    );

    const inspecaoId = resultado.insertId;
    console.log('Inspeção criada com ID:', inspecaoId);

    const fotos = { 'foto_painel': 'PAINEL', 'foto_frontal': 'FRONTAL', 'foto_traseira': 'TRASEIRA', 'foto_lateral_direita': 'LATERAL_DIREITA', 'foto_lateral_esquerda': 'LATERAL_ESQUERDA' };
    for (const [campo, tipo] of Object.entries(fotos)) {
      if (dados[campo]) {
        let fotoPath = dados[campo];
        if (FotoUtils.isBase64(fotoPath)) {
          fotoPath = await FotoUtils.save(fotoPath, `inspecao_${inspecaoId}_${tipo.toLowerCase()}`);
        }
        await connection.query('INSERT INTO bbb_inspecao_foto (inspecao_id, tipo, foto) VALUES (?, ?, ?)', [inspecaoId, tipo, fotoPath]);
      }
    }

    if (dados.itens_inspecao && Array.isArray(dados.itens_inspecao)) {
      for (const item of dados.itens_inspecao) {
        if (item.status) {
          let fotoPath = item.foto || null;
          if (fotoPath && FotoUtils.isBase64(fotoPath)) fotoPath = await FotoUtils.save(fotoPath, `item_${inspecaoId}_${item.item.replace(/\s/g, '_')}`);
          await connection.query(`INSERT INTO bbb_inspecao_item (inspecao_id, categoria, item, status, foto, pressao, foto_caneta, descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [inspecaoId, item.categoria, item.item, item.status, fotoPath, null, null, item.descricao || null]);
        }
      }
    }

    if (dados.itens_pneus && Array.isArray(dados.itens_pneus)) {
      for (const pneu of dados.itens_pneus) {
        if (pneu.status) {
          let fotoPath = pneu.foto || null;
          let fotoCanetaPath = pneu.foto_caneta || null;
          if (fotoPath && FotoUtils.isBase64(fotoPath)) fotoPath = await FotoUtils.save(fotoPath, `pneu_${inspecaoId}_${pneu.item.replace(/\s/g, '_')}`);
          if (fotoCanetaPath && FotoUtils.isBase64(fotoCanetaPath)) fotoCanetaPath = await FotoUtils.save(fotoCanetaPath, `pneu_caneta_${inspecaoId}_${pneu.item.replace(/\s/g, '_')}`);
          await connection.query(`INSERT INTO bbb_inspecao_item (inspecao_id, categoria, item, status, foto, pressao, foto_caneta, descricao) VALUES (?, 'PNEU', ?, ?, ?, ?, ?, ?)`, [inspecaoId, pneu.item, pneu.status, fotoPath, pneu.pressao || null, fotoCanetaPath, pneu.descricao || null]);
        }
      }
    }

    await connection.commit();
    res.status(201).json({ sucesso: true, mensagem: 'Checklist salvo com sucesso', id: inspecaoId });
    console.log('=== CHECKLIST SALVO - ID:', inspecaoId, '===');
  } catch (error) {
    await connection.rollback();
    console.error('ERRO:', error.message);
    res.status(500).json({ erro: 'Erro ao salvar checklist', detalhes: error.message });
  } finally {
    connection.release();
  }
});

router.get('/get', async (req, res) => {
  const acao = req.query.acao || 'todos';
  try {
    const connection = await db.pool.getConnection();
    switch (acao) {
      case 'id':
        if (!req.query.id) return res.status(400).json({ erro: 'ID não informado' });
        const [inspecao] = await connection.query(`SELECT i.*, u.nome as usuario_nome FROM bbb_inspecao_veiculo i LEFT JOIN bbb_usuario u ON i.usuario_id = u.id WHERE i.id = ?`, [req.query.id]);
        if (inspecao.length === 0) { connection.release(); return res.status(404).json({ erro: 'Inspeção não encontrada' }); }
        const [fotos] = await connection.query('SELECT * FROM bbb_inspecao_foto WHERE inspecao_id = ?', [req.query.id]);
        const [itens] = await connection.query('SELECT * FROM bbb_inspecao_item WHERE inspecao_id = ?', [req.query.id]);
        connection.release();
        res.json({ ...inspecao[0], fotos, itens });
        break;
      case 'placa':
        if (!req.query.placa) return res.status(400).json({ erro: 'Placa não informada' });
        const [inspecoesPorPlaca] = await connection.query(`SELECT i.*, u.nome as usuario_nome FROM bbb_inspecao_veiculo i LEFT JOIN bbb_usuario u ON i.usuario_id = u.id WHERE i.placa LIKE ? ORDER BY i.data_realizacao DESC LIMIT 100`, [`%${req.query.placa}%`]);
        connection.release();
        res.json(inspecoesPorPlaca);
        break;
      default:
        const limite = parseInt(req.query.limite) || 100;
        const [todasInspecoes] = await connection.query(`SELECT i.*, u.nome as usuario_nome FROM bbb_inspecao_veiculo i LEFT JOIN bbb_usuario u ON i.usuario_id = u.id ORDER BY i.data_realizacao DESC LIMIT ?`, [limite]);
        connection.release();
        res.json(todasInspecoes);
    }
  } catch (error) {
    console.error('ERRO:', error.message);
    res.status(500).json({ erro: 'Erro ao buscar inspeções', detalhes: error.message });
  }
});

module.exports = router;
