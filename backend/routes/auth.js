const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * POST /api/auth/login
 * Autenticação de usuários e outras ações relacionadas
 * Suporta múltiplas ações via campo "acao" no body
 */
router.post('/login', async (req, res) => {
  console.log('=== AUTH REQUEST ===');
  console.log('Full request body:', JSON.stringify(req.body));

  const { acao } = req.body;

  // Se não tem ação, assume que é login (compatibilidade)
  const action = acao || 'login';
  console.log('Action:', action);

  try {
    switch (action) {
      case 'login':
        return await handleLogin(req, res);

      case 'marcar_tutorial_concluido':
        return await handleMarcarTutorial(req, res);

      case 'definir_senha':
        return await handleDefinirSenha(req, res);

      default:
        return res.status(400).json({
          erro: 'Ação não reconhecida',
          acao: action
        });
    }
  } catch (error) {
    console.error('ERRO:', error.message);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      detalhes: error.message
    });
  }
});

/**
 * Trata o login do usuário
 */
async function handleLogin(req, res) {
  const { nome, senha } = req.body;
  console.log('LOGIN - Nome:', nome, '| Senha:', senha ? '***' : 'vazio');

  if (!nome || !senha) {
    return res.status(400).json({ erro: 'Nome e senha são obrigatórios' });
  }

  const connection = await db.pool.getConnection();

  const [usuarios] = await connection.query(
    `SELECT * FROM ${db.table('usuario')} WHERE nome = ? AND senha = ? AND ativo = 1`,
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
}

/**
 * Marca o tutorial como concluído para um usuário
 */
async function handleMarcarTutorial(req, res) {
  const { usuario_id } = req.body;
  console.log('MARCAR TUTORIAL - Usuario ID:', usuario_id);

  if (!usuario_id) {
    return res.status(400).json({ erro: 'usuario_id é obrigatório' });
  }

  const connection = await db.pool.getConnection();

  await connection.query(
    `UPDATE ${db.table('usuario')} SET tutorial_concluido = 1 WHERE id = ?`,
    [usuario_id]
  );

  connection.release();

  console.log('Tutorial marcado como concluído para usuário:', usuario_id);

  res.json({
    sucesso: true,
    mensagem: 'Tutorial marcado como concluído'
  });
}

/**
 * Define a senha do usuário (primeiro acesso)
 */
async function handleDefinirSenha(req, res) {
  const { usuario_id, nova_senha } = req.body;
  console.log('DEFINIR SENHA - Usuario ID:', usuario_id);

  if (!usuario_id || !nova_senha) {
    return res.status(400).json({ erro: 'usuario_id e nova_senha são obrigatórios' });
  }

  const connection = await db.pool.getConnection();

  await connection.query(
    `UPDATE ${db.table('usuario')} SET senha = ? WHERE id = ?`,
    [nova_senha, usuario_id]
  );

  connection.release();

  console.log('Senha definida para usuário:', usuario_id);

  res.json({
    sucesso: true,
    mensagem: 'Senha definida com sucesso'
  });
}

/**
 * GET /api/auth/usuarios
 * Lista todos os usuários
 */
router.get('/usuarios', async (req, res) => {
  try {
    const connection = await db.pool.getConnection();

    const [usuarios] = await connection.query(
      `SELECT id, nome, ativo, tipo_usuario, tutorial_concluido, data_criacao FROM ${db.table('usuario')} ORDER BY nome`
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
