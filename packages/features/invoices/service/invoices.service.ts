import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { InvoiceId } from '../domain/ids';
import type { InvoiceStatus } from '../domain/status';
import type { BudgetStatus, Contract, Invoice, InvoicePatch, Supplier } from '../domain/types';
import { budgetStatus, setBudgetLine, type BudgetLineInput, type BudgetQuery } from './budget';
import { listContracts } from './contract-queries';
import {
  createContract,
  findContractsForSupplier,
  type ContractsForSupplierInput,
  type CreateContractInput,
} from './contracts';
import { invoiceDetail, type InvoiceDetail } from './detail';
import {
  createInvoice,
  getInvoice,
  listInvoices,
  type CreateInvoiceInput,
  type ListInvoicesInput,
} from './invoice-records';
import { createSupplier, findSupplierByIco, listSuppliers, type CreateSupplierInput } from './suppliers';
import { receiveInvoiceMail, type ReceiveInvoiceMailInput, type ReceivedInvoice } from './receive';
import { transition } from './transitions';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method is
 * the module next to it, so a tool or an agent can call the same function without going through Nest.
 */
@Injectable()
export class InvoicesService {
  createSupplier(ctx: RequestContext, input: CreateSupplierInput): Promise<Supplier> {
    return createSupplier(ctx, input);
  }

  findSupplierByIco(ctx: RequestContext, ico: string): Promise<Supplier | null> {
    return findSupplierByIco(ctx, ico);
  }

  listSuppliers(ctx: RequestContext): Promise<readonly Supplier[]> {
    return listSuppliers(ctx);
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

  listContracts(ctx: RequestContext, svjId: SvjId): Promise<readonly Contract[]> {
    return listContracts(ctx, svjId);
  }

  invoiceDetail(ctx: RequestContext, invoiceId: InvoiceId): Promise<InvoiceDetail> {
    return invoiceDetail(ctx, invoiceId);
  }

  setBudgetLine(ctx: RequestContext, input: BudgetLineInput): Promise<void> {
    return setBudgetLine(ctx, input);
  }

  budgetStatus(ctx: RequestContext, query: BudgetQuery): Promise<BudgetStatus> {
    return budgetStatus(ctx, query);
  }

  receiveInvoiceMail(ctx: RequestContext, input: ReceiveInvoiceMailInput): Promise<ReceivedInvoice> {
    return receiveInvoiceMail(ctx, input);
  }

  createInvoice(ctx: RequestContext, input: CreateInvoiceInput): Promise<Invoice> {
    return createInvoice(ctx, input);
  }

  getInvoice(ctx: RequestContext, invoiceId: InvoiceId): Promise<Invoice> {
    return getInvoice(ctx, invoiceId);
  }

  listInvoices(ctx: RequestContext, input?: ListInvoicesInput): Promise<readonly Invoice[]> {
    return listInvoices(ctx, input);
  }

  transition(
    ctx: RequestContext,
    invoiceId: InvoiceId,
    to: InvoiceStatus,
    patch?: InvoicePatch,
  ): Promise<Invoice> {
    return transition(ctx, invoiceId, to, patch);
  }
}
