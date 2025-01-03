# Sumário do Projeto Next.js

## Introdução
Este documento fornece um resumo das melhorias planejadas para o projeto Next.js.

## Melhorias Planejadas
Para otimizar a busca de dados no seu aplicativo, as seguintes melhorias serão implementadas:

1. **Banco de Dados**: 
   Criar um banco de dados na mesma região do código do aplicativo para reduzir a latência entre o servidor e o banco de dados.

2. **Busca de Dados no Servidor**: 
   Implementar a busca de dados no servidor com componentes do React Server, permitindo que a lógica e as buscas de dados caras permaneçam no servidor, reduzindo o pacote JavaScript do lado do cliente e evitando a exposição de segredos do banco de dados.

3. **Uso de SQL**: 
   Utilizar SQL para buscar apenas os dados necessários, diminuindo a quantidade de dados transferidos para cada solicitação e a quantidade de JavaScript necessária para transformar os dados na memória.

4. **Paralelização**: 
   Paralelizar a busca de dados com JavaScript onde fizer sentido, para melhorar a eficiência.

5. **Streaming**: 
   Implementar o Streaming para evitar que solicitações lentas de dados bloqueiem a página inteira, permitindo que o usuário comece a interagir com a UI sem esperar que tudo carregue.

6. **Busca de Dados Dinâmica**: 
   Mover a busca de dados para os componentes que precisam deles, isolando quais partes das rotas devem ser dinâmicas.

## Próximos Passos
No próximo capítulo, veremos dois padrões comuns que você pode precisar implementar ao buscar dados: pesquisa e paginação.
