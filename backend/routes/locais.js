const db = require('../config/database');

/**
 * GET /api/locais
 */
async function get(req, res) {
  try {
    const apenasHabilitados = req.query.apenas_habilitados === 'true';

    let sql = 'SELECT * FROM checklist_locais';
    if (apenasHabilitados) {
      sql += ' WHERE habilitado = 1';
    }
    sql += ' ORDER BY ordem ASC, nome ASC';

    const locais = await db.query(sql);
    res.json(locais);
  } catch (error) {
    console.error('Erro ao buscar locais:', error);
    res.status(500).json({ erro: 'Erro ao buscar locais' });
  }
}

/**
 * POST /api/locais
 */
async function set(req, res) {
  try {
    const acao = req.body.acao;

    if (acao === 'adicionar') {
      const { nome, ordem = 0 } = req.body;
      if (!nome) {
        return res.status(400).json({ erro: 'Campo obrigatório: nome' });
      }
      const result = await db.query(
        'INSERT INTO checklist_locais (nome, ordem) VALUES (?, ?)',
        [nome, ordem]
      );
      res.json({ sucesso: true, id: result.insertId });

    } else if (acao === 'atualizar') {
      const { id, nome, habilitado, ordem } = req.body;
      if (!id) {
        return res.status(400).json({ erro: 'ID não informado' });
      }
      const updates = [];
      const params = [];
      if (nome !== undefined) { updates.push('nome = ?'); params.push(nome); }
      if (habilitado !== undefined) { updates.push('habilitado = ?'); params.push(habilitado ? 1 : 0); }
      if (ordem !== undefined) { updates.push('ordem = ?'); params.push(ordem); }
      if (updates.length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
      }
      params.push(id);
      await db.query(`UPDATE checklist_locais SET ${updates.join(', ')} WHERE id = ?`, params);
      res.json({ sucesso: true });

    } else if (acao === 'remover') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ erro: 'ID não informado' });
      }
      await db.query('DELETE FROM checklist_locais WHERE id = ?', [id]);
      res.json({ sucesso: true });

    } else {
      res.status(400).json({ erro: 'Ação não reconhecida' });
    }
  } catch (error) {
    console.error('Erro ao processar locais:', error);
    res.status(500).json({ erro: 'Erro ao processar locais' });
  }
}

module.exports = { get, set };
