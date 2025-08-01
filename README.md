# Catching Game

Projeto desenvolvido para a disciplina de Computação Gráfica do curso de Engenharia da Computação da Universidade Federal do Ceará (Campus Sobral).

## Equipe
- Antonio Breno Oliveira Magalhães
- Francisco de Assis Paiva Neto
- Jose Gabriel Alves de Paula
- Kaique Damasceno Sousa 
- Luis Felipe Pereira Furtado
- Pâmela Maria Pontes Frota
- Vitória Emilly Santos Melo


---

## Objetivos

Este projeto visa implementar um pequeno jogo de "cesta" de bolinhas (usaremos frutas) utilizando Three.js com os seguintes objetivos:

- Simulação usando conceitos de física.
- A “cesta”	controlado	com	o	mouse.
- As	bolinhas (frutas)	são	geradas	por	sistema	de	partículas.	
  
## Tecnologias Utilizadas

- **HTML v5.0:** Para construção da página.
- **Three.js v0.162.0:** Biblioteca principal para renderização 3D em Javascript.
- **Node:** Instalação para rodar o projeto localmente.

---

## Funcionalidades Implementadas

### Controles
- **Teclado**:
  - `← →` Movimenta a cesta
  - `Espaço` Pausa/despausa
  - `R` Reinicia o jogo
  - `D` Ativa modo debug
- **Mouse**:
  - Arraste para mover a cesta

### Mecânicas Principais
- Sistema físico com:
  - Gravidade ajustável (-9.82 a -100)
  - Colisões realistas
  - Comportamentos físicos diferenciados
- Sistema de pontuação:
  - Frutas: +1 a +3 pontos
  - Lixo: -2 pontos
- Partidas cronometradas (30 segundos)

### Interface
- Telas interativas:
  - Início
  - Pause
  - Game Over
- Elementos visuais:
  - Placar dinâmico
  - Cronômetro
  - Efeitos especiais

### Sistemas Técnicos
- Geração procedural de objetos:
  - 5 tipos de frutas
  - 3 tipos de lixo
- Gerenciamento automático:
  - Limite de 20 objetos
  - Remoção de itens antigos
- Efeitos de partículas:
  - Fogos de artifício (highscores)
  - Explosões visuais

### Dificuldade
| Nível   | Gravidade | Velocidade |
|---------|-----------|------------|
| Fácil   | -9.82     | 10         |
| Médio   | -30       | 25         |
| Difícil | -60       | 40         |
| Insano  | -100      | 70         |

---

## Manual do Usuário

### Pré-requisitos

- **Node.js (versão 18.x ou superior):**
  - Windows/macOS: Baixe o instalador em [https://nodejs.org](https://nodejs.org).
  - Linux (Ubuntu/Debian): `sudo apt update && sudo apt install nodejs npm`.
- **Git (opcional, apenas para clonar o repositório):**
  - Windows/macOS: Baixe em [https://git-scm.com](https://git-scm.com).
  - Linux: `sudo apt install git`.

### Passo a Passo para Executar

#### Método 1: Via GitHub (Recomendado)

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/GabrielAlves263/catching-game.git
    ```
2.  **Acesse a pasta do projeto:**
    ```bash
    cd catching-game
    ```
3.  **Instale as dependências:**
    ```bash
    npm install three cannon-es cannon-es-debugger
    ```
4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npx vite
    ```
5.  **Acesse no navegador:**
    Abra `http://localhost:5173` no seu navegador.

#### Método 2: Via ZIP (Sem Git)

1.  **Baixe o projeto como ZIP:**
    - Clique em "Code" → "Download ZIP".
2.  **Extraia o arquivo ZIP** em uma pasta local.
3.  **Siga os passos 3 a 6** do Método 1.
