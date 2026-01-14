const db = require('../config/database');

/**
 * GET/POST/PUT /b_veicular_tempotelas.php
 */
async function handle(req, res) {
  const connection = await db.getPool().getConnection();
  
  try {
    const method = req.method;

    if (method === 'POST') {
      // Salvar tempo de tela
      const dados = req.body;

      if (!dados || !dados.tela || !dados.tempo_segundos) {
        return res.status(400).json({
          erro: 'Dados incompletos. É necessário informar: tela, tempo_segundos, data_hora_inicio, data_hora_fim'
        });
      }

      const [result] = await connection.execute(
        `INSERT INTO checklist_tempo_telas
         (inspecao_id, usuario_id, tela, tempo_segundos, data_hora_inicio, data_hora_fim)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          dados.inspecao_id || null,
          dados.usuario_id || null,
          dados.tela,
          dados.tempo_segundos,
          dados.data_hora_inicio,
          dados.data_hora_fim
        ]
      );

      res.status(201).json({
        sucesso: true,
        id: result.insertId,
        mensagem: 'Tempo de tela registrado com sucesso'
      });
    } else if (method === 'PUT') {
      // Atualizar registros de tempo com inspecao_id
      const dados = req.body;

      if (!dados || !dados.inspecao_id || !dados.usuario_id) {
        return res.status(400).json({
          erro: 'Dados incompletos. É necessário informar: inspecao_id, usuario_id'
        });
      }

      const [result] = await connection.execute(
        `UPDATE checklist_tempo_telas
         SET inspecao_id = ?
         WHERE usuario_id = ?
           AND inspecao_id IS NULL
           AND data_registro >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,
        [dados.inspecao_id, dados.usuario_id]
      );

      res.json({
        sucesso: true,
        mensagem: 'Registros de tempo atualizados com sucesso',
        linhas_afetadas: result.affectedRows
      });
    } else if (method === 'GET') {
      // Buscar tempos de tela
      const acao = req.query.acao || 'todos';

      switch (acao) {
        case 'inspecao':
          if (!req.query.inspecao_id) {
            return res.status(400).json({ erro: 'ID da inspeção não informado' });
          }

          const temposInspecao = await db.query(
            `SELECT * FROM checklist_tempo_telas
             WHERE inspecao_id = ?
             ORDER BY data_hora_inicio ASC`,
            [req.query.inspecao_id]
          );

          res.json(temposInspecao);
          break;

        case 'usuario':
          if (!req.query.usuario_id) {
            return res.status(400).json({ erro: 'ID do usuário não informado' });
          }

          const temposUsuario = await db.query(
            `SELECT * FROM checklist_tempo_telas
             WHERE usuario_id = ?
             ORDER BY data_hora_inicio DESC
             LIMIT 100`,
            [req.query.usuario_id]
          );

          res.json(temposUsuario);
          break;

        case 'estatisticas':
          const estatisticas = await db.query(
            `SELECT
                tela,
                COUNT(*) as total_registros,
                AVG(tempo_segundos) as tempo_medio_segundos,
                MIN(tempo_segundos) as tempo_minimo_segundos,
                MAX(tempo_segundos) as tempo_maximo_segundos,
                SUM(tempo_segundos) as tempo_total_segundos
             FROM checklist_tempo_telas
             GROUP BY tela
             ORDER BY tempo_medio_segundos DESC`
          );

          res.json(estatisticas);
          break;

        case 'todos':
        default:
          const limite = parseInt(req.query.limite) || 100;

          const todos = await db.query(
            `SELECT * FROM checklist_tempo_telas
             ORDER BY data_hora_inicio DESC
             LIMIT ?`,
            [limite]
          );

          res.json(todos);
          break;
      }
    } else {
      res.status(405).json({ erro: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro em tempo-telas.handle:', error);
    res.status(500).json({
      erro: 'Erro no banco de dados',
      mensagem: error.message
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  handle
};
