// hooks/use-fetch-data.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

// Interface para definir a estrutura do retorno do hook
interface FetchResult<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * Hook genérico para buscar dados de uma URL de API.
 * @param url O endpoint da API para buscar os dados.
 * @returns Um objeto contendo os dados, o estado de carregamento e possíveis erros.
 */
export function useFetchData<T>(url: string): FetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // Captura erros de HTTP (ex: 404, 500)
                const errorBody = await response.text();
                throw new Error(`Erro na requisição: ${response.status} ${response.statusText}. Detalhes: ${errorBody}`);
            }
            const result = await response.json();
            setData(result);
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e);
            } else {
                setError(new Error('Ocorreu um erro desconhecido'));
            }
        } finally {
            setIsLoading(false);
        }
    }, [url]);

    useEffect(() => {
        // Busca os dados quando o componente é montado ou a URL muda
        fetchData();
    }, [fetchData]);

    // A função refetch permite que o componente re-execute a busca de dados manualmente
    return { data, isLoading, error, refetch: fetchData };
}