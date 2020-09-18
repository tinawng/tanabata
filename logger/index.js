import log_model from './models/Log.js';

export default function (reponse, payload) {
  let log_obj = {
    method: reponse.request.raw.method,
    url: reponse.request.raw.url,
    params: reponse.request.params,
    ip: reponse.request.headers['x-forwarded-for'],
    user_id: reponse.request.user_id || undefined,
    status: reponse.raw.statusCode,
    request_body_size: JSON.stringify(reponse.request.body).length,
    response_body_size: payload.length || undefined,
    error: null
  }

  const parsed_payload = JSON.parse(payload);

  if (parsed_payload.error)
    log_obj.error = parsed_payload.error;

  const log = new log_model(log_obj);
  log.save();
}