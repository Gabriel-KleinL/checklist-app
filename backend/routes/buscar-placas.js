const db = require('../config/database');

/**
 * Handler para b_buscar_placas.php
 */
async function handle(req, res) {
  try {
    const termo = (req.query.termo || '').trim();
    const limite = parseInt(req.query.limite, 10) || 20;

    console.log('🔍 BUSCAR PLACAS - Termo:', termo, '| Limite:', limite);

    let sql = `SELECT DISTINCT LicensePlate as placa
               FROM Vehicles
               WHERE LicensePlate IS NOT NULL
                 AND LicensePlate != ''`;
    const params = [];

    if (termo) {
      sql += ' AND UPPER(LicensePlate) LIKE UPPER(?)';
      params.push(`%${termo}%`);
    }

    sql += ` ORDER BY LicensePlate ASC LIMIT ${limite}`;

    console.log('  SQL:', sql);
    console.log('  Params:', params);

    const placas = await db.query(sql, params);
    const lista = placas.map(p => p.placa).filter(Boolean);

    console.log('  ✅ Encontradas', lista.length, 'placas:', lista);

    return res.json({
      sucesso: true,
      total: lista.length,
      placas: lista
    });
  } catch (error) {
    console.error('');
    console.error('❌ ERRO BUSCAR PLACAS:');
    console.error('  Mensagem:', error.message);
    console.error('  Stack:', error.stack);
    console.error('  Query:', req.query);
    console.error('');
    return res.status(500).json({
      erro: 'Erro ao buscar placas',
      detalhes: error.message
    });
  }
}

module.exports = { handle };
