const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET - Listar todos os campos de inspeção
router.get('/', async (req, res) => {
  try {
    const tipoVeiculoId = req.query.tipo_veiculo_id;

    let sql = `
      SELECT
        c.*,
        COALESCE(c.tem_foto, 0) as tem_foto,
        tv.nome as tipo_veiculo_nome,
        tv.icone as tipo_veiculo_icone
      FROM checklist_config_campos_inspecao c
      LEFT JOIN checklist_tipos_veiculo tv ON c.tipo_veiculo_id = tv.id
      WHERE 1=1
    `;
    const params = [];

    if (tipoVeiculoId) {
      sql += ` AND (c.tipo_veiculo_id = ? OR c.tipo_veiculo_id IS NULL)`;
      params.push(tipoVeiculoId);
    }

    sql += ` 
      GROUP BY c.id, c.nome_campo, c.label, c.tipo_campo, c.obrigatorio, c.habilitado, c.ordem, c.tipo_veiculo_id, c.data_criacao, tv.nome, tv.icone
      ORDER BY c.ordem ASC, c.id ASC
    `;

    const campos = await db.query(sql, params);

    res.json({
      success: true,
      data: campos
    });
  } catch (error) {
    console.error('Erro ao buscar campos de inspeção:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar campos de inspeção',
      details: error.message
    });
  }
});

// GET - Listar campos habilitados para um tipo de veículo
router.get('/habilitados/:tipoVeiculoId', async (req, res) => {
  try {
    const { tipoVeiculoId } = req.params;

    const sql = `
      SELECT * FROM checklist_config_campos_inspecao
      WHERE habilitado = 1
        AND (tipo_veiculo_id = ? OR tipo_veiculo_id IS NULL)
      ORDER BY ordem ASC, id ASC
    `;

    const campos = await db.query(sql, [tipoVeiculoId]);

    res.json({
      success: true,
      data: campos
    });
  } catch (error) {
    console.error('Erro ao buscar campos habilitados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar campos habilitados',
      details: error.message
    });
  }
});

// POST - Adicionar novo campo de inspeção
router.post('/', async (req, res) => {
  try {
    const { nome_campo, label, tipo_campo = 'text', obrigatorio = false, tem_foto = false, habilitado = true, ordem, tipo_veiculo_id, opcoes } = req.body;

    if (!nome_campo || !label) {
      return res.status(400).json({
        success: false,
        error: 'nome_campo e label são obrigatórios'
      });
    }

    // Converter opcoes para JSON string se for array
    const opcoesJson = opcoes ? (typeof opcoes === 'string' ? opcoes : JSON.stringify(opcoes)) : null;

    const sql = `
      INSERT INTO checklist_config_campos_inspecao
      (nome_campo, label, tipo_campo, opcoes, obrigatorio, tem_foto, habilitado, ordem, tipo_veiculo_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(sql, [
      nome_campo,
      label,
      tipo_campo,
      opcoesJson,
      obrigatorio ? 1 : 0,
      tem_foto ? 1 : 0,
      habilitado ? 1 : 0,
      ordem || null,
      tipo_veiculo_id || null
    ]);

    res.json({
      success: true,
      message: 'Campo adicionado com sucesso',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erro ao adicionar campo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar campo',
      details: error.message
    });
  }
});

// PUT - Atualizar campo de inspeção
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_campo, label, tipo_campo, opcoes, obrigatorio, tem_foto, habilitado, ordem, tipo_veiculo_id } = req.body;

    const updates = [];
    const params = [];

    if (nome_campo !== undefined) {
      updates.push('nome_campo = ?');
      params.push(nome_campo);
    }
    if (label !== undefined) {
      updates.push('label = ?');
      params.push(label);
    }
    if (tipo_campo !== undefined) {
      updates.push('tipo_campo = ?');
      params.push(tipo_campo);
    }
    if (opcoes !== undefined) {
      updates.push('opcoes = ?');
      // Converter opcoes para JSON string se for array
      params.push(opcoes ? (typeof opcoes === 'string' ? opcoes : JSON.stringify(opcoes)) : null);
    }
    if (obrigatorio !== undefined) {
      updates.push('obrigatorio = ?');
      params.push(obrigatorio ? 1 : 0);
    }
    if (tem_foto !== undefined) {
      updates.push('tem_foto = ?');
      params.push(tem_foto ? 1 : 0);
    }
    if (habilitado !== undefined) {
      updates.push('habilitado = ?');
      params.push(habilitado ? 1 : 0);
    }
    if (ordem !== undefined) {
      updates.push('ordem = ?');
      params.push(ordem);
    }
    if (tipo_veiculo_id !== undefined) {
      updates.push('tipo_veiculo_id = ?');
      params.push(tipo_veiculo_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar'
      });
    }

    params.push(id);
    const sql = `UPDATE checklist_config_campos_inspecao SET ${updates.join(', ')} WHERE id = ?`;

    await db.query(sql, params);

    res.json({
      success: true,
      message: 'Campo atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar campo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar campo',
      details: error.message
    });
  }
});

// PATCH - Toggle habilitado/desabilitado
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      UPDATE checklist_config_campos_inspecao
      SET habilitado = NOT habilitado
      WHERE id = ?
    `;

    await db.query(sql, [id]);

    // Buscar o estado atualizado
    const [campo] = await db.query(
      'SELECT * FROM checklist_config_campos_inspecao WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `Campo ${campo.habilitado ? 'habilitado' : 'desabilitado'} com sucesso`,
      habilitado: campo.habilitado
    });
  } catch (error) {
    console.error('Erro ao alternar campo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao alternar campo',
      details: error.message
    });
  }
});

// DELETE - Remover campo de inspeção
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM checklist_config_campos_inspecao WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Campo removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover campo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover campo',
      details: error.message
    });
  }
});

module.exports = router;
