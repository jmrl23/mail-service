import {
  type Transporter,
  type SentMessageInfo,
  type TransportOptions,
  createTransport,
} from 'nodemailer';
import { CacheService } from './cache.service';
import { google, type Auth } from 'googleapis';
import { caching } from 'cache-manager';
import { MailSendDto } from '../dtos/MailSend.dto';
import env from 'env-var';

export class MailService {
  private static instance: MailService;
  private transporter: Transporter<SentMessageInfo>;

  private constructor(
    private readonly oauth2Client: Auth.OAuth2Client,
    private readonly cacheService: CacheService,
  ) {}

  public static async createInstance(): Promise<MailService> {
    const oauth2Client = new google.auth.OAuth2(
      env.get('GOOGLE_CLIENT_ID').asString(),
      env.get('GOOGLE_CLIENT_SECRET').asString(),
    );

    oauth2Client.setCredentials({
      refresh_token: env.get('GOOGLE_REFRESH_TOKEN').asString(),
    });

    const instance = new MailService(
      oauth2Client,
      await CacheService.createInstance(
        caching('memory', {
          ttl: 60 * 1000 * 60 * 6,
        }),
      ),
    );

    return instance;
  }

  public static async getInstance(): Promise<MailService> {
    if (!MailService.instance) {
      MailService.instance = await MailService.createInstance();
    }

    return MailService.instance;
  }

  public async sendMail(mailSendDto: MailSendDto): Promise<unknown> {
    await this.refreshTransport();

    const response = await this.transporter.sendMail(mailSendDto);

    return response;
  }

  private async refreshTransport(): Promise<void> {
    const cacheKey = 'MailService:refreshTransport():state(isTransportActive)';
    const isTransporterActive = await this.cacheService.get<boolean>(cacheKey);

    if (isTransporterActive) return;

    const accessToken = await this.oauth2Client.getAccessToken();

    this.transporter = createTransport({
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
    } as TransportOptions);

    await this.cacheService.set(cacheKey, true, 60 * 1000 * 60 * 6);
  }
}
