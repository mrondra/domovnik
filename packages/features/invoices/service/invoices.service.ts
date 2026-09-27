import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { InvoiceId } from '../domain/ids';
import type { InvoiceStatus } from '../domain/status';
import type { BudgetStatus, Invoice, InvoicePatch } from '../domain/types';
import { budgetStatus, setBudgetLine, type BudgetLineInput, type BudgetQuery } from './budget';
import { invoiceDetail, type InvoiceDetail } from './detail';
import {
  createInvoice,
  getInvoice,
  listInvoices,
  type CreateInvoiceInput,
  type ListInvoicesInput,
} from './invoice-records';
import { receiveInvoiceMail, type ReceiveInvoiceMailInput, type ReceivedInvoice } from './receive';
import { transition } from './transitions';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method is
 * the module next to it, so a tool or an agent can call the same function without going through Nest.
 */
@Injectable()
export class InvoicesService {
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
