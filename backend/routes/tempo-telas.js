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

      console.log('⏱️ TEMPO TELAS POST - Dados recebidos:', JSON.stringify(dados));

      if (!dados || !dados.tela || dados.tempo_segundos === undefined || dados.tempo_segundos === null) {
        console.error('❌ ERRO: Dados incompletos. Requerido: tela, tempo_segundos');
        return res.status(400).json({
          erro: 'Dados incompletos. É necessário informar: tela, tempo_segundos'
        });
      }

      // A tabela local tem apenas: id, inspecao_id, tela, tempo_segundos, data_registro
      const inspecaoId = (dados.inspecao_id !== undefined && dados.inspecao_id !== null && dados.inspecao_id !== '') 
        ? parseInt(dados.inspecao_id) 
        : null;
      const tela = String(dados.tela).trim();
      const tempoSegundos = parseInt(dados.tempo_segundos);
      
      if (!tela || isNaN(tempoSegundos) || tempoSegundos < 0) {
        console.error('❌ ERRO: Dados inválidos. tela:', tela, 'tempo_segundos:', tempoSegundos);
        return res.status(400).json({
          erro: 'Dados inválidos. tela deve ser uma string e tempo_segundos deve ser um número positivo'
        });
      }
      
      console.log('  Valores finais - inspecaoId:', inspecaoId, 'tela:', tela, 'tempoSegundos:', tempoSegundos);
      
      const [result] = await connection.execute(
        `INSERT INTO ${db.table('tempo_telas')}
         (inspecao_id, tela, tempo_segundos)
         VALUES (?, ?, ?)`,
        [
          inspecaoId,
          tela,
          tempoSegundos
        ]
      );

      console.log('✅ Tempo de tela registrado - ID:', result.insertId);

      res.status(201).json({
        sucesso: true,
        id: result.insertId,
        mensagem: 'Tempo de tela registrado com sucesso'
      });
    } else if (method === 'PUT') {
      // Atualizar registros de tempo com inspecao_id
      const dados = req.body;

      console.log('⏱️ TEMPO TELAS PUT - Dados recebidos:', JSON.stringify(dados));

      if (!dados || !dados.inspecao_id) {
        console.error('❌ ERRO: inspecao_id não informado');
        return res.status(400).json({
          erro: 'Dados incompletos. É necessário informar: inspecao_id'
        });
      }

      // Atualiza registros recentes (últimos 30 minutos) que ainda não têm inspecao_id
      const [result] = await connection.execute(
        `UPDATE ${db.table('tempo_telas')}
         SET inspecao_id = ?
         WHERE inspecao_id IS NULL
           AND data_registro >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,
        [dados.inspecao_id]
      );

      console.log('✅ Registros atualizados:', result.affectedRows);

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
            `SELECT * FROM ${db.table('tempo_telas')}
             WHERE inspecao_id = ?
             ORDER BY data_registro ASC`,
            [req.query.inspecao_id]
          );

          res.json(temposInspecao);
          break;

        case 'usuario':
          if (!req.query.usuario_id) {
            return res.status(400).json({ erro: 'ID do usuário não informado' });
          }

          // Nota: A tabela local não tem usuario_id, então buscamos por inspecao_id do usuário
          // ou retornamos vazio se não houver inspecao_id
          const temposUsuario = await db.query(
            `SELECT tt.*, i.usuario_id
             FROM ${db.table('tempo_telas')} tt
             LEFT JOIN ${db.table('inspecao_veiculo')} i ON tt.inspecao_id = i.id
             WHERE i.usuario_id = ?
             ORDER BY tt.data_registro DESC
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
             FROM ${db.table('tempo_telas')}
             GROUP BY tela
             ORDER BY tempo_medio_segundos DESC`
          );

          res.json(estatisticas);
          break;

        case 'todos':
        default:
          const limite = parseInt(req.query.limite) || 100;

          const todos = await db.query(
            `SELECT * FROM ${db.table('tempo_telas')}
             ORDER BY data_registro DESC
             LIMIT ${limite}`
          );

          res.json(todos);
          break;
      }
    } else {
      res.status(405).json({ erro: 'Método não permitido' });
    }
  } catch (error) {
    console.error('');
    console.error('❌ ERRO TEMPO TELAS:');
    console.error('  Método:', req.method);
    console.error('  Query:', req.query);
    console.error('  Body:', req.body);
    console.error('  Mensagem:', error.message);
    console.error('  Stack:', error.stack);
    console.error('');
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
