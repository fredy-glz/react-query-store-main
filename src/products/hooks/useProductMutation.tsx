import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, productActions } from "..";

export const useProductMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: productActions.createProduct,
    onMutate: (product) => {
      // Optimistic Product
      const optimisticProduct = { id: Math.random(), ...product };

      // Almacenar el producto en el cache del queryClient
      queryClient.setQueryData<Product[]>(
        ["products", { filterKey: product.category }],
        (old) => {
          if (!old) return [optimisticProduct];

          return [...old, optimisticProduct];
        }
      );

      return { optimisticProduct };
    },
    onSuccess: (product, _variables, context) => {
      // INVALIDATE QUERIES
      // queryClient.invalidateQueries({
      //   queryKey: ["products", { filterKey: data.category }],
      // });

      // Remover el producto con id ficticio
      queryClient.removeQueries({
        queryKey: ["product", context?.optimisticProduct.id],
      });

      // Filtro: Mujeres
      queryClient.setQueryData<Product[]>(
        ["products", { filterKey: product.category }],
        (old) => {
          if (!old) return [product];

          // Optimistic update
          return old.map((catchProduct) => {
            return catchProduct.id === context?.optimisticProduct.id
              ? product
              : catchProduct;
          });
        }
      );

      // Filtro: Todo
      queryClient.setQueryData<Product[]>(["products", {}], (old) => {
        if (!old) return [product];

        // Optimistic update
        return old.map((catchProduct) => {
          return catchProduct.id === context?.optimisticProduct.id
            ? product
            : catchProduct;
        });
      });

      queryClient.setQueriesData;
    },
    onError: (_error, variables, context) => {
      // Remover el producto con id ficticio
      queryClient.removeQueries({
        queryKey: ["product", context?.optimisticProduct.id],
      });

      // Filtro: Mujeres
      queryClient.setQueryData<Product[]>(
        ["products", { filterKey: variables.category }],
        (old) => {
          if (!old) return [];

          // Optimistic update
          return old.filter((catchProduct) => {
            return catchProduct.id !== context?.optimisticProduct.id;
          });
        }
      );
    },
  });

  return mutation;
};
