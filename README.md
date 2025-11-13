# 🔥 Flashfire: Ecommerce de Flash Sales

![Screenshot da Página Principal do Flashfire](public/screenshot.PNG)
## 🌟 Visão Geral

O Flashfire é uma aplicação web Full-Stack de ecommerce especializada em flash sales (vendas relâmpago), projetada para oferecer produtos com descontos imperdíveis por tempo limitado. Desenvolvido com tecnologias modernas, o Flashfire oferece uma solução eficiente e segura para compras online com descontos exclusivos.

Este projeto demonstra habilidades sólidas em desenvolvimento Full-Stack, gerenciamento de banco de dados, autenticação, e-commerce e gerenciamento de produtos em promoção.

**[➡️ Acesse a versão ao vivo aqui!](https://flashfire.vercel.app/)**

---

## ✨ Funcionalidades Principais

* **Autenticação Segura:** Login de usuários via GitHub (OAuth), garantindo acesso fácil e seguro.
* **Gerenciamento de Usuários:** Distinção entre diferentes tipos de usuários:
* **Clientes:** Podem navegar pelos produtos, adicionar ao carrinho e fazer compras.
* **Vendedores:** Podem gerenciar seus produtos e monitorar vendas.
* **Administradores:** Têm controle total sobre a plataforma.
* **Catálogo de Produtos:** Visualização intuitiva de produtos com preços e detalhes.
* **Sistema de Flash Sales:** Produtos com preços reduzidos por tempo limitado.
* **Carrinho de Compras:** Sistema de adição e gerenciamento de itens no carrinho.
* **Sistema de Pedidos:** Controle completo de pedidos e status de entrega.
* **API RESTful:** Backend eficiente para todas as operações CRUD (Create, Read, Update, Delete) de produtos e pedidos.

---

## 👥 Papéis de Usuário (Roles)

O sistema implementa uma lógica de autorização baseada em três papéis:

* **`CUSTOMER` (Cliente):**
    * Papel padrão para **todos os novos usuários** que se cadastram via GitHub (definido via `@default(CUSTOMER)` no schema Prisma).
    * Pode visualizar produtos.
    * Pode adicionar produtos ao carrinho e fazer compras.
    * Pode visualizar e gerenciar seus próprios pedidos.
* **`SELLER` (Vendedor):**
    * **Atribuição:** A promoção de um usuário para `SELLER` é feita **manualmente** pelo administrador diretamente no banco de dados.
    * Pode gerenciar seus próprios produtos.
    * Pode visualizar estatísticas de vendas.
    * Pode criar flash sales para seus produtos.
* **`ADMIN` (Administrador):**
    * **Atribuição:** Atribuição feita **manualmente** pelo administrador principal.
    * Pode gerenciar todos os produtos de todos os vendedores.
    * Pode gerenciar todos os pedidos.
    * Pode gerenciar todos os usuários.
    * Pode criar e gerenciar flash sales para toda a plataforma.

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** [Next.js](https://nextjs.org/) (App Router) - Para o desenvolvimento Full-Stack, renderização de componentes e API Routes.
* **Linguagem:** JavaScript
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/) - Para um design responsivo e moderno.
* **Autenticação:** [NextAuth.js](https://next-auth.js.org/) - Sistema completo de autenticação com provedores OAuth (GitHub).
* **ORM:** [Prisma](https://www.prisma.io/) - Gerenciamento de banco de dados, modelagem e consultas.
* **Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL) - Backend como serviço (BaaS), com banco de dados gerenciado.

[![My Skills](https://skillicons.dev/icons?i=nextjs,react,tailwind,prisma,supabase)](https://skillicons.dev)

---


## 🚀 Como Rodar Localmente

Para configurar e executar o Flashfire no seu ambiente de desenvolvimento:

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/tharcio09/flashfire.git](https://github.com/tharcio09/flashfire.git)
    cd flashfire
    ```

2.  **Siga as instruções detalhadas de configuração:**
    Consulte o arquivo [`DEVELOPMENT.md`](./DEVELOPMENT.md) na raiz do projeto para obter informações sobre variáveis de ambiente (`.env`), configuração do Supabase, GitHub OAuth e como iniciar o servidor.

---

## 📫 Contato

**Tharcio Santos**

* [LinkedIn](https://www.linkedin.com/in/tharcio-santos/)
* [Email](tharciosantos09@gmail.com)
