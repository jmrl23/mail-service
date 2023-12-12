import {
  type Transporter,
  type SentMessageInfo,
  createTransport,
  TransportOptions,
} from 'nodemailer';
import { CacheService } from './cache.service';
import { google } from 'googleapis';
import { caching } from 'cache-manager';
import { MailSendDto } from '../dtos/MailSend.dto';
import env from 'env-var';

export class MailService {
  private static instance: MailService;

  private constructor(
    private readonly transporter: Transporter<SentMessageInfo>,
    private readonly cacheService: CacheService,
  ) {}

  public static async createInstance(options?: unknown): Promise<MailService> {
    const instance = new MailService(
      createTransport(options as TransportOptions),
      await CacheService.createInstance(
        caching('memory', {
          ttl: 60 * 1000 * 60 * 6,
        }),
      ),
    );

    return instance;
  }

  public static async getInstance(): Promise<MailService> {
    const accessTokenCacheKey = 'MailService:var(accessToken)';

    if (!MailService.instance) {
      const oauth2Client = new google.auth.OAuth2(
        env.get('GOOGLE_CLIENT_ID').asString(),
        env.get('GOOGLE_CLIENT_SECRET').asString(),
      );

      oauth2Client.setCredentials({
        refresh_token: env.get('GOOGLE_REFRESH_TOKEN').asString(),
      });

      const accessToken = await oauth2Client.getAccessToken();

      MailService.instance = await MailService.createInstance({
        host: env.get('SMTP_TRANSPORT_HOST').asString(),
        port: env.get('SMTP_TRANSPORT_PORT').default(465).asPortNumber(),
        secure: env.get('SMTP_TRANSPORT_SECURED').default('false').asBool(),
        auth: {
          type: 'OAuth2',
          user: env.get('SMTP_TRANSPORT_USER').asString(),
          clientId: env.get('GOOGLE_CLIENT_ID').asString(),
          clientSecret: env.get('GOOGLE_CLIENT_SECRET').asString(),
          refreshToken: env.get('GOOGLE_REFRESH_TOKEN').asString(),
          accessToken,
        },
      });

      MailService.instance.cacheService.set(accessTokenCacheKey, accessToken);
    }

    const accessTokenCache =
      await MailService.instance.cacheService.get<string>(accessTokenCacheKey);

    if (!accessTokenCache) {
      MailService.instance = null as unknown as MailService;

      return await MailService.getInstance();
    }

    return MailService.instance;
  }

  public async sendMail(mailSendDto: MailSendDto): Promise<unknown> {
    const response = await this.transporter.sendMail(mailSendDto);

    return response;
  }
}
