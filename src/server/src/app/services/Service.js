const pool = require('../../configs/db');

exports.create = async ({ desc, dateTime, rooms, value, address }, userTel) => {
  await pool.query(
    `
    insert into cria_servico (telefone_usuario)
    values ($1)
    returning num_servico;
  `,
    [userTel]
  );

  const res = await pool.query(
    `
    select * from cria_servico where telefone_usuario = ${userTel} order by num_servico desc limit 1;
  `
  );

  const num_servico = res.rows[0].num_servico;

  const service = await pool.query(
    `
    insert into servico (
      num_servico_criado,
      descricao_atividade,
      data_horario,
      comodos,
      valor,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    returning *;
  `,
    [
      num_servico,
      desc,
      dateTime,
      rooms,
      value,
      address.cep,
      address.logradouro,
      address.numero,
      address.complemento,
      address.bairro,
      address.cidade,
      address.uf,
    ]
  );

  return service;
};

exports.getServices = async () => {
  const result = await pool.query(`select * from servico;`);

  if (!result.rowCount) return null;

  return result;
};

exports.getRequesterServices = async (tel) => {
  const result = await pool.query(
    `
    SELECT
      s.num_servico_criado,
      s.descricao_atividade,
      s.data_horario,
      s.comodos,
      s.valor,
      s.cep,
      s.logradouro,
      s.numero,
      s.complemento,
      s.bairro,
      s.cidade,
      s.uf,
      s.status,
      (
        select d.chave_pix from diarista d
        where d.telefone = ats.telefone_diarista
      ) as pix_diarista
    FROM servico s
    INNER JOIN cria_servico cs
    ON s.num_servico_criado = cs.num_servico
    LEFT JOIN atende_servico ats
    ON s.num_servico_criado = ats.num_servico_atendido
    WHERE cs.telefone_usuario = $1;
  `,
    [tel]
  );

  if (!result.rowCount) return null;

  return result;
};

exports.createTreatmentService = async (num_servico_atendido, tel_diarista) => {
  const result = await pool.query(
    `insert into atende_servico (num_servico_atendido, telefone_diarista)
    values  ($1, $2) returning *`,
    [num_servico_atendido, tel_diarista]
  );

  if (!result.rowCount) return null;

  return result;
};

exports.setServiceStatus = async (newStatus, serviceId) => {
  const result = await pool.query(
    `UPDATE servico
    SET status = $1
    WHERE num_servico_criado = $2`,
    [newStatus, serviceId]
  );

  if (!result.rowCount) return null;

  return result;
};

exports.rateService = async (score, serviceId) => {
  const result = await pool.query(
    `UPDATE cria_servico
    SET nota = $1
    WHERE num_servico = $2`,
    [score, serviceId]
  );

  if (!result.rowCount) return null;

  return result;
};

exports.getMyAverageRate = async (telefoneUsuario) => {
  const result = await pool.query(
    `select avg(avaliacao_usuario) from avalia_usuario where telefone_usuario = $1`,
    [telefoneUsuario]
  );

  if (!result.rowCount) return null;

  return result.rows[0];
};