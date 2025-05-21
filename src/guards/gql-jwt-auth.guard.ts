//gql-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { BaseJwtAuthGuard } from './base-jwt-auth.guard';

@Injectable()
export class GqlJwtAuthGuard extends BaseJwtAuthGuard {
  extractRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}