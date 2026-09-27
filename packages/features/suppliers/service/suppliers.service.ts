import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { ContractId, SupplierId } from '../domain/ids';
import type { Contract, Supplier } from '../domain/types';
import { contractById, listContracts } from './contract-queries';
import {
  createContract,
  findContractsForSupplier,
  type ContractsForSupplierInput,
  type CreateContractInput,
} from './contracts';
import {
  createSupplier,
  findSupplierByIco,
  listSuppliers,
  supplierById,
  type CreateSupplierInput,
} from './suppliers';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method is
 * the module next to it, so a tool or an agent can call the same function without going through Nest.
 */
@Injectable()
export class SuppliersService {
  createSupplier(ctx: RequestContext, input: CreateSupplierInput): Promise<Supplier> {
    return createSupplier(ctx, input);
  }

  findSupplierByIco(ctx: RequestContext, ico: string): Promise<Supplier | null> {
    return findSupplierByIco(ctx, ico);
  }

  listSuppliers(ctx: RequestContext): Promise<readonly Supplier[]> {
    return listSuppliers(ctx);
  }

  supplierById(ctx: RequestContext, supplierId: SupplierId): Promise<Supplier | null> {
    return supplierById(ctx, supplierId);
  }

  createContract(ctx: RequestContext, input: CreateContractInput): Promise<Contract> {
    return createContract(ctx, input);
  }

  findContractsForSupplier(
    ctx: RequestContext,
    input: ContractsForSupplierInput,
  ): Promise<readonly Contract[]> {
    return findContractsForSupplier(ctx, input);
  }

  contractById(ctx: RequestContext, contractId: ContractId): Promise<Contract | null> {
    return contractById(ctx, contractId);
  }

  listContracts(ctx: RequestContext, svjId: SvjId): Promise<readonly Contract[]> {
    return listContracts(ctx, svjId);
  }
}
