import { NestFactory } from '@nestjs/core';
import { ValidationPipe, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createConnection } from 'typeorm';
import cookieParser from 'cookie-parser';
import glob from 'glob';

function requireDefaults(pattern: string) {
    return glob.sync(pattern, { cwd: __dirname, absolute: true })
    .map(require)
    .map(imported => imported.default);
}

const controllers = requireDefaults('*.module/*-controller.ts');
const middleware = requireDefaults('*.module/*-middleware.ts');

@Module({
    controllers
})
class ApplicationModule implements NestModule {
    configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
        consumer.apply(cookieParser(), ...middleware).forRoutes('/');
    }
}

export async function bootstrap() { 
    await createConnection();
    const app = await NestFactory.create(ApplicationModule);

    app.useGlobalPipes(new ValidationPipe());

    const options = new DocumentBuilder().addBearerAuth().build();
    const document = SwaggerModule.createDocument(app, options);

    SwaggerModule.setup('/', app, document);

    await app.listen(3000);
}