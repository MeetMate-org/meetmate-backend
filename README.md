# MeetMate Server  

MeetMate is the server-side component of an application built using the [NestJS](https://nestjs.com/) framework. It provides an API for managing meetings and user-related operations.  

## Description  

This repository contains the backend implementation for the MeetMate application. It is written in TypeScript and follows NestJS's modular architecture. The application includes features such as API documentation, environment-based configuration, and testing support.  

## Project Setup  

### Prerequisites  

- Node.js (>= 14.x)  
- pnpm (>= 7.x)  

### Installation  

Install dependencies using `pnpm`:  

```bash  
$ pnpm install  
```  

## Running the Project  

### Development Mode  

```bash  
$ pnpm run start  
```  

### Watch Mode (Auto-Restart)  

```bash  
$ pnpm run start:dev  
```  

### Production Mode  

```bash  
$ pnpm run start:prod  
```  

## API Documentation  

API documentation is generated using Swagger and is available at `/api` after starting the server. The Swagger configuration is located in `src/main.ts`:  

```typescript  
const config = new DocumentBuilder()  
  .setTitle('MeetMate API')  
  .setDescription('MeetMate API docs')  
  .setVersion('1.0')  
  .addApiKey(  
    { type: 'apiKey', name: 'x-access-token', in: 'header' },  
    'x-access-token'  
  )  
  .build();  

const document = SwaggerModule.createDocument(app, config);  
SwaggerModule.setup('api', app, document);  
```  

## Environment Configuration  

The application uses environment variables for configuration. Environment configuration files are located in the root directory and follow the `.env.<environment>` format, e.g.:  

- `.env.development`  
- `.env.production`  

The active environment is determined by the `NODE_ENV` variable. If not set, it defaults to `development`. Environment file loading is implemented in `src/main.ts`:  

```typescript  
const envPath = path.resolve(  
  __dirname,  
  `../.env.${process.env.NODE_ENV || 'development'}`  
);  
require('dotenv').config({ path: envPath });  
```  

## Testing  

### Unit Tests  

```bash  
$ pnpm run test  
```  

### End-to-End Tests  

```bash  
$ pnpm run test:e2e  
```  

### Test Coverage  

```bash  
$ pnpm run test:cov  
```  

## Project Structure  

```
src/  
  main.ts  
  app.module.ts  
  app.controller.ts  
  app.service.ts  
  config/  
    configuration.ts  
  meetings/  
    meetings.controller.ts  
    meetings.service.ts  
    meetings.module.ts  
  interfaces/  
    meetingProps.ts  
test/  
  app.e2e-spec.ts  
```  

### Key Directories  

- `src/` – Contains the main application code.  
- `main.ts` – The application entry point.  
- `config/` – Configuration-related files.  
- `meetings/` – Module for managing meetings.  
- `interfaces/` – TypeScript interfaces for data structures.  
- `test/` – End-to-end test files.  

## Deployment  

To deploy the application, follow these steps:  

1. Configure environment variables in `.env.<environment>` files.  
2. Build the project:  

```bash  
$ pnpm run build  
```  

3. Run the application in production mode:  

```bash  
$ pnpm run start:prod  
```  

## Resources  

- [NestJS Documentation](https://docs.nestjs.com/)  
- [Swagger Documentation](https://swagger.io/docs/)  
- [pnpm Documentation](https://pnpm.io/)  

## License  

This project is licensed under the MIT License.