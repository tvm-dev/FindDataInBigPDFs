# FindDataInBigPDFs

Ferramenta para buscar texto em PDFs, incluindo arquivos escaneados, utilizando Node.js e tecnologias de OCR (Reconhecimento Óptico de Caracteres).

---

## Requisitos

Para que o projeto funcione corretamente, você precisa ter os seguintes programas instalados no seu sistema operacional:

1.  **Node.js**: [Faça o download e a instalação](https://nodejs.org/pt-br/download/).
2.  **Poppler**: Ferramenta necessária para a conversão de PDFs em imagens.
    * **Windows**: [Baixe os utilitários](https://github.com/oschwartz10612/poppler-windows) e adicione a pasta `bin` ao seu `PATH` do sistema.
    * **macOS**: Instale via Homebrew com o comando `brew install poppler`.
    * **Linux (Ubuntu/Debian)**: Instale via apt com o comando `sudo apt-get install poppler-utils`.
3.  **Git**: Para clonar o repositório.

---

## Instalação

Siga os passos abaixo para configurar o projeto na sua máquina local:

1.  Clone o repositório:
    ```bash
    git clone [https://github.com/seu-usuario/nome-do-seu-projeto.git](https://github.com/seu-usuario/nome-do-seu-projeto.git)
    ```
2.  Navegue até o diretório do projeto:
    ```bash
    cd nome-do-seu-projeto
    ```
3.  Instale as dependências do Node.js:
    ```bash
    npm install
    ```

---

## Como Usar

### Modo de Desenvolvimento

Para iniciar o servidor com reinicialização automática (ideal para desenvolvimento):
```bash
npm run dev