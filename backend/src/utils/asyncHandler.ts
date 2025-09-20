import { Request, Response, NextFunction } from "express";

/**
 * Wrapper para funções assíncronas em rotas Express
 * Captura automaticamente erros e os passa para o middleware de tratamento de erros
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
