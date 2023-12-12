import { Router } from 'express';
import { validate, wrapper } from '@jmrl23/express-helper';
import { authorizationMiddleware } from '../middlewares/authorization.middleware';
import { MailService } from '../services/mail.service';
import { MailSendDto } from '../dtos/MailSend.dto';

export const controller = Router();

controller

  .get(
    '/',
    wrapper(function (_request, response) {
      response.status(200).end('OK');
    }),
  )

  /**
   * @openapi
   *
   * /send:
   *  post:
   *    summary: send mail
   *    requestBody:
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/MailSend'
   *    responses:
   *      '200':
   *        description: Successful response
   *        content:
   *          application/json: {}
   */

  .post(
    '/send',
    authorizationMiddleware,
    validate('BODY', MailSendDto),
    wrapper(async function (request) {
      const mailService = await MailService.getInstance();
      const mail = await mailService.sendMail(request.body);

      return {
        mail,
      };
    }),
  );
