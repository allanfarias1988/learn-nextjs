import { createClient } from "@supabase/supabase-js";
import type {
	CustomerField,
	CustomersTableType,
	InvoiceForm,
	InvoicesTable,
	LatestInvoiceRaw,
	Revenue,
} from "./definitions";
import { formatCurrency } from "./utils";
import { env } from "node:process";

if (!env.SUPABASE_URL) {
	throw new Error("SUPABASE_URL is not defined");
}
const supabaseUrl = env.SUPABASE_URL as string;
const supabaseAnonKey = env.SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchRevenue(): Promise<Revenue[]> {
	try {
		const { data, error } = await supabase
			.from("revenue")
			.select("*")
			.order("month");

		if (error) throw error;
		return data as Revenue[];
	} catch (error) {
		console.error("Erro no banco de dados:", error);
		throw new Error("Erro ao carregar receita.");
	}
}

export async function fetchLatestInvoices(): Promise<LatestInvoiceRaw[]> {
	try {
		const { data, error } = await supabase
			.from("invoices")
			.select(`
		id,
		amount,
		date,
		c:customers (
		  name,
		  email,
		  image_url
		)
	  `)
			.order("date", { ascending: false })
			.limit(5);

		if (error) throw error;

		const formattedData = data.map((invoice) => ({
			id: invoice.id,
			amount: invoice.amount,
			name: invoice.c?.name ?? "",
			email: invoice.c?.email ?? "",
			image_url: invoice.c?.image_url ?? "",
		}));

		return formattedData;
	} catch (error) {
		console.error("Erro no banco de dados:", error);
		throw new Error("Erro ao carregar faturas mais recentes.");
	}
}

export async function fetchCardData() {
	try {
		const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
			supabase.from("invoices").select("count", { count: "exact" }),
			supabase.from("customers").select("count", { count: "exact" }),
			supabase.from("invoices").select("status, amount").eq("status", "paid"),
		]);

		const totalPaid =
			invoiceStatus.data?.reduce((acc, invoice) => acc + invoice.amount, 0) ??
			0;
		const totalPending =
			invoiceStatus.data?.reduce((acc, invoice) => acc + invoice.amount, 0) ??
			0;

		return {
			numberOfCustomers: customerCount.count ?? 0,
			numberOfInvoices: invoiceCount.count ?? 0,
			totalPaidInvoices: formatCurrency(totalPaid),
			totalPendingInvoices: formatCurrency(totalPending),
		};
	} catch (error) {
		console.error("Erro:", error);
		throw new Error("Falha ao carregar dados.");
	}
}

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
	query: string,
	currentPage: number,
): Promise<InvoicesTable[]> {
	const offset = (currentPage - 1) * ITEMS_PER_PAGE;

	try {
		let queryBuilder = supabase.from("invoices").select(`  
                *,  
                customers(*)  
            `);

		// Adiciona filtros se houver query
		if (query && query.trim()) {
			queryBuilder = queryBuilder.or(
				`customers.name.ilike.%${query}%,status.ilike.%${query}%`,
			);
		}

		// Adiciona ordenação e paginação depois dos filtros
		const { data, error } = await queryBuilder
			.order("date", { ascending: false })
			.range(offset, offset + ITEMS_PER_PAGE - 1);

		if (error) {
			console.error("Erro na query:", error);
			return [];
		}

		return (data || []) as InvoicesTable[];
	} catch (error) {
		console.error("Erro ao buscar faturas:", error);
		return [];
	}
}

export async function fetchInvoicesPages(query: string): Promise<number> {
	try {
		let queryBuilder = supabase
			.from("invoices")
			.select("*", { count: "exact", head: true });

		// Adiciona filtros se houver query
		if (query && query.trim()) {
			queryBuilder = queryBuilder.or(
				`customers.name.ilike.%${query}%,status.ilike.%${query}%`,
			);
		}

		const { count, error } = await queryBuilder;

		if (error) {
			console.error("Erro detalhado Supabase:", error);
			return 1;
		}

		return Math.max(1, Math.ceil((count ?? 0) / ITEMS_PER_PAGE));
	} catch (error) {
		console.error("Erro ao buscar total de páginas:", error);
		return 1;
	}
}

export async function fetchInvoiceById(id: string): Promise<InvoiceForm> {
	try {
		const { data, error } = await supabase
			.from("invoices")
			.select(`  
        id,  
        customer_id,  
        amount,  
        status,  
        date,  
        customers (id, name, email, image_url)  
      `)
			.eq("id", id)
			.single();

		if (error) throw error;

		return {
			...data,
			amount: data.amount / 100,
		} as InvoiceForm;
	} catch (error) {
		console.error("Erro no banco de dados:", error);
		throw new Error("Erro ao carregar a faturas.");
	}
}

export async function fetchCustomers(): Promise<CustomerField[]> {
	try {
		const { data, error } = await supabase
			.from("customers")
			.select("id, name")
			.order("name");

		if (error) throw error;
		return data as CustomerField[];
	} catch (error) {
		console.error("Erro no banco de dados:", error);
		throw new Error("Erro ao carregar todos os clientes.");
	}
}

export async function fetchFilteredCustomers(
	query: string,
): Promise<CustomersTableType[]> {
	try {
		const { data, error } = await supabase
			.from("customers")
			.select("*")
			.ilike("name", `%${query}%`)
			.order("name");

		if (error) throw error;
		return data as CustomersTableType[];
	} catch (error) {
		console.error("Erro no banco de dados:", error);
		throw new Error("Erro ao carregar clientes.");
	}
}
