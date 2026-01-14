const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/tipos-veiculo
 * Lista todos os tipos de veículos
 */
router.get('/', async (req, res) => {
  try {
    const connection = await db.pool.getConnection();

    const [tipos] = await connection.query(
      `SELECT * FROM ${db.table('tipos_veiculo')} ORDER BY nome`
    );

    connection.release();

    res.json(tipos);

  } catch (error) {
    console.error('ERRO:', error.message);
    res.status(500).json({
      erro: 'Erro ao buscar tipos de veículos',
      detalhes: error.message
    });
  }
});

/**
 * GET /api/tipos-veiculo/:id
 * Busca um tipo de veículo específico
 */
router.get('/:id', async (req, res) => {
  try {
    const connection = await db.pool.getConnection();

    const [tipos] = await connection.query(
      `SELECT * FROM ${db.table('tipos_veiculo')} WHERE id = ?`,
      [req.params.id]
    );

    connection.release();

    if (tipos.length === 0) {
      return res.status(404).json({ erro: 'Tipo de veículo não encontrado' });
    }

    res.json(tipos[0]);

  } catch (error) {
    console.error('ERRO:', error.message);
    res.status(500).json({
      erro: 'Erro ao buscar tipo de veículo',
      detalhes: error.message
    });
  }
});

module.exports = router;
