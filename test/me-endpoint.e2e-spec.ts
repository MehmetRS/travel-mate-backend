import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AuthController /me endpoint (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /me should return 404 without authentication', () => {
    return request(app.getHttpServer())
      .get('/me')
      .expect(401); // Should be 401 Unauthorized, not 404
  });

  it('GET /me route should exist and be accessible', () => {
    return request(app.getHttpServer())
      .get('/me')
      .expect((response) => {
        // The endpoint should exist and return either 401 (unauthorized) or 200 (with valid token)
        // It should NEVER return 404 (not found)
        if (response.status === 404) {
          throw new Error('GET /me returned 404 - endpoint not found!');
        }
      });
  });
});
