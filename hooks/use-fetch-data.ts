// hooks/use-fetch-data.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface FetchResult<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

// CORREÇÃO: A URL agora pode ser uma string ou null.
export function useFetchData<T>(url: string | null): FetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        // CORREÇÃO: Se a URL for nula, não fazemos a chamada e resetamos o estado.
        // Isso é útil para buscas que dependem de outras variáveis.
        if (url === null) {
            setData(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(url);
            if (!response.ok) {
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
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}