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
		console.error("Error:", error);
		throw new Error("Failed to fetch revenue data.");
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
		console.error("Error:", error);
		throw new Error("Failed to fetch latest invoices.");
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
		console.error("Error:", error);
		throw new Error("Failed to fetch card data.");
	}
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
	query: string,
	currentPage: number,
): Promise<InvoicesTable[]> {
	const offset = (currentPage - 1) * ITEMS_PER_PAGE;

	try {
		const { data, error } = await supabase
			.from("invoices")
			.select(`  
        id,  
        amount,  
        date,  
        status,  
        customers (name, email, image_url)  
      `)
			.ilike("customers.name", `%${query}%`)
			.order("date", { ascending: false })
			.range(offset, offset + ITEMS_PER_PAGE - 1);

		if (error) throw error;
		return data as unknown as InvoicesTable[];
	} catch (error) {
		console.error("Error:", error);
		throw new Error("Failed to fetch invoices.");
	}
}

export async function fetchInvoicesPages(query: string): Promise<number> {
	try {
		const { count, error } = await supabase
			.from("invoices")
			.select("*, customers (name, email)", { count: "exact", head: true })
			.ilike("customers.name", `%${query}%`)
			.or(
				`email.ilike.%${query}%,amount::text.ilike.%${query}%,date::text.ilike.%${query}%,status.ilike.%${query}%`,
			);

		if (error) throw error;

		const totalPages = Math.ceil(Number(count) / ITEMS_PER_PAGE);
		return totalPages;
	} catch (error) {
		console.error("Database Error:", error);
		throw new Error("Failed to fetch total number of invoices.");
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
		console.error("Database Error:", error);
		throw new Error("Failed to fetch invoice.");
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
		console.error("Database Error:", error);
		throw new Error("Failed to fetch all customers.");
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
		console.error("Database Error:", error);
		throw new Error("Failed to fetch customers.");
	}
}
