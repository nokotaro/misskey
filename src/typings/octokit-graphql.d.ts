declare module '@octokit/graphql' {
	import { Agent } from 'http';

	interface IConvertableToString {
		toString(): string;
	}

	interface IGraphQLRequestOptions extends Partial<GlobalFetch> {
		agent?: Agent;
		signal?: AbortSignal;
		timeout?: number;
	}

	interface IGraphQLOptions {
		method?: string;
		baseUrl?: string;
		url?: string;
		headers?: Record<string, string | IConvertableToString>;
		request?: IGraphQLRequestOptions;
		query?: string;
		[variableOptions: string]: any;
	}

	interface IGraphQL {
		(query: string, options: IGraphQLOptions): Promise<Record<string, any>>;
		defaults(options: IGraphQLOptions): IGraphQL;
	}

	const graphql: IGraphQL;

	namespace graphql {} // Hack

	export = graphql;
}
