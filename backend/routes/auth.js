const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * POST /api/auth/login
 * Autenticação de usuários
 */
router.post('/login', async (req, res) => {
  const { nome, senha } = req.body;

  console.log('=== LOGIN ATTEMPT ===');
  console.log('Nome:', nome);

  if (!nome || !senha) {
    return res.status(400).json({ erro: 'Nome e senha são obrigatórios' });
  }

  try {
    const connection = await db.pool.getConnection();

    const [usuarios] = await connection.query(
      'SELECT * FROM bbb_usuario WHERE nome = ? AND senha = ? AND ativo = 1',
      [nome, senha]
    );

    connection.release();

    if (usuarios.length === 0) {
      console.log('Login falhou: usuário não encontrado ou inativo');
      return res.status(401).json({ 
        erro: 'Credenciais inválidas',
        mensagem: 'Usuário ou senha incorretos' 
      });
    }

    const usuario = usuarios[0];
    console.log('Login bem-sucedido:', usuario.nome);

    res.json({
      sucesso: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        tipo_usuario: usuario.tipo_usuario,
        ativo: usuario.ativo,
        tutorial_concluido: usuario.tutorial_concluido
      }
    });

  } catch (error) {
    console.error('ERRO LOGIN:', error.message);
    res.status(500).json({
      erro: 'Erro ao fazer login',
      detalhes: error.message
    });
  }
});

/**
 * GET /api/auth/usuarios
 * Lista todos os usuários
 */
router.get('/usuarios', async (req, res) => {
  try {
    const connection = await db.pool.getConnection();

    const [usuarios] = await connection.query(
      'SELECT id, nome, ativo, tipo_usuario, tutorial_concluido, data_criacao FROM bbb_usuario ORDER BY nome'
    );

    connection.release();

    res.json(usuarios);

  } catch (error) {
    console.error('ERRO:', error.message);
    res.status(500).json({
      erro: 'Erro ao buscar usuários',
      detalhes: error.message
    });
  }
});

module.exports = router;
