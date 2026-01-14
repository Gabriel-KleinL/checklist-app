const db = require('../config/database');

/**
 * GET /b_veicular_anomalias.php
 */
async function get(req, res) {
  try {
    const tipo = req.query.tipo || 'ativas';

    let sql = `SELECT
                  i.placa,
                  i.id as inspecao_id,
                  i.data_realizacao,
                  i.km_inicial,
                  ii.categoria,
                  ii.item,
                  ii.status,
                  COALESCE(u.nome, 'Usuário não identificado') as usuario_nome,
                  ast.status_anomalia,
                  ast.data_aprovacao,
                  ast.data_finalizacao,
                  ast.observacao,
                  ast.usuario_aprovador_id,
                  COALESCE(u_aprovador.nome, NULL) as usuario_aprovador_nome
               FROM checklist_inspecao_veiculo i
               INNER JOIN checklist_inspecao_item ii ON i.id = ii.inspecao_id
               LEFT JOIN checklist_usuario u ON i.usuario_id = u.id
               LEFT JOIN checklist_anomalia_status ast ON (
                   BINARY UPPER(TRIM(ast.placa)) = BINARY UPPER(TRIM(i.placa))
                   AND BINARY UPPER(TRIM(ast.categoria)) = BINARY UPPER(TRIM(ii.categoria))
                   AND BINARY TRIM(ast.item) = BINARY TRIM(ii.item)
               )
               LEFT JOIN checklist_usuario u_aprovador ON ast.usuario_aprovador_id = u_aprovador.id
               WHERE LOWER(ii.status) NOT IN ('bom', 'ótimo', 'otimo', 'contem', 'contém', 'satisfatória', 'satisfatório', 'satisfatoria', 'satisfatorio')
                   AND ii.status IS NOT NULL
                   AND ii.status != ''`;

    // Filtro por tipo
    if (tipo === 'finalizadas') {
      sql += " AND ast.status_anomalia = 'finalizado'";
    } else {
      // Ativas: pendentes, aprovadas ou sem status
      sql += " AND (ast.status_anomalia IS NULL OR ast.status_anomalia IN ('pendente', 'aprovado'))";
    }

    sql += " ORDER BY i.placa, i.data_realizacao DESC";

    const anomalias = await db.query(sql);

    // Processa resultados agrupando por placa
    const anomaliasPorPlaca = {};
    const indiceProblemas = {};

    anomalias.forEach(anomalia => {
      const placa = anomaly.placa.toUpperCase().trim();
      const categoria = anomaly.categoria.toUpperCase().trim();
      const item = anomaly.item.trim();

      if (!anomaliasPorPlaca[placa]) {
        anomaliasPorPlaca[placa] = {
          placa: placa,
          total_anomalias: 0,
          problemas: []
        };
      }

      const chaveProblema = `${placa}_${categoria}_${item}`;
      if (!indiceProblemas[chaveProblema]) {
        indiceProblemas[chaveProblema] = true;
        anomaliasPorPlaca[placa].problemas.push({
          categoria: categoria,
          item: item,
          status: anomaly.status,
          inspecao_id: anomaly.inspecao_id,
          data_realizacao: anomaly.data_realizacao,
          km_inicial: anomaly.km_inicial,
          usuario_nome: anomaly.usuario_nome,
          status_anomalia: anomaly.status_anomalia,
          data_aprovacao: anomaly.data_aprovacao,
          data_finalizacao: anomaly.data_finalizacao,
          observacao: anomaly.observacao,
          usuario_aprovador_nome: anomaly.usuario_aprovador_nome
        });
        anomaliasPorPlaca[placa].total_anomalias++;
      }
    });

    const resultado = Object.values(anomaliasPorPlaca);

    res.json(resultado);
  } catch (error) {
    console.error('Erro em anomalias.get:', error);
    res.status(500).json({
      erro: 'Erro ao buscar anomalias',
      detalhes: error.message
    });
  }
}

/**
 * POST /b_anomalia_status.php
 */
async function updateStatus(req, res) {
  const connection = await db.getPool().getConnection();
  
  try {
    await connection.beginTransaction();

    const dados = req.body;
    const { placa, categoria, item, acao, observacao, usuario_id } = dados;

    if (!placa || !categoria || !item || !acao) {
      return res.status(400).json({ erro: 'Campos obrigatórios não informados' });
    }

    const placaNormalizada = placa.toUpperCase().trim();
    const categoriaNormalizada = categoria.toUpperCase().trim();
    const itemNormalizado = item.trim();

    // Busca registro existente
    const [existente] = await connection.execute(
      `SELECT * FROM checklist_anomalia_status
       WHERE BINARY UPPER(TRIM(placa)) = BINARY UPPER(?)
       AND BINARY UPPER(TRIM(categoria)) = BINARY UPPER(?)
       AND BINARY TRIM(item) = BINARY TRIM(?)
       LIMIT 1`,
      [placaNormalizada, categoriaNormalizada, itemNormalizado]
    );

    if (acao === 'aprovar') {
      if (existente.length > 0) {
        await connection.execute(
          `UPDATE checklist_anomalia_status
           SET status_anomalia = 'aprovado',
               data_aprovacao = NOW(),
               usuario_aprovador_id = ?
           WHERE id = ?`,
          [usuario_id, existente[0].id]
        );
      } else {
        await connection.execute(
          `INSERT INTO checklist_anomalia_status
           (placa, categoria, item, status_anomalia, data_aprovacao, usuario_aprovador_id)
           VALUES (?, ?, ?, 'aprovado', NOW(), ?)`,
          [placaNormalizada, categoriaNormalizada, itemNormalizado, usuario_id]
        );
      }
    } else if (acao === 'reprovar') {
      if (existente.length > 0) {
        await connection.execute(
          `UPDATE checklist_anomalia_status
           SET status_anomalia = 'reprovado',
               observacao = ?
           WHERE id = ?`,
          [observacao || null, existente[0].id]
        );
      } else {
        await connection.execute(
          `INSERT INTO checklist_anomalia_status
           (placa, categoria, item, status_anomalia, observacao)
           VALUES (?, ?, ?, 'reprovado', ?)`,
          [placaNormalizada, categoriaNormalizada, itemNormalizado, observacao || null]
        );
      }
    } else if (acao === 'finalizar') {
      if (existente.length > 0) {
        await connection.execute(
          `UPDATE checklist_anomalia_status
           SET status_anomalia = 'finalizado',
               data_finalizacao = NOW(),
               observacao = ?
           WHERE id = ?`,
          [observacao || null, existente[0].id]
        );
      } else {
        await connection.execute(
          `INSERT INTO checklist_anomalia_status
           (placa, categoria, item, status_anomalia, data_finalizacao, observacao)
           VALUES (?, ?, ?, 'finalizado', NOW(), ?)`,
          [placaNormalizada, categoriaNormalizada, itemNormalizado, observacao || null]
        );
      }
    } else {
      return res.status(400).json({ erro: 'Ação não reconhecida' });
    }

    await connection.commit();

    res.json({
      sucesso: true,
      mensagem: `Anomalia ${acao} com sucesso`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro em anomalias.updateStatus:', error);
    res.status(500).json({
      erro: 'Erro ao atualizar status da anomalia',
      detalhes: error.message
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  get,
  updateStatus
};
