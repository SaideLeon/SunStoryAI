# StoryVoice AI 🎙️🎬

Uma suíte de produção de narrativas completa impulsionada por Inteligência Artificial. O **StoryVoice AI** transforma textos simples em narrações humanas ultra-realistas, gera storyboards cinematográficos e exporta vídeos verticais prontos para redes sociais (TikTok, Reels, Shorts) utilizando os modelos mais recentes do Google Gemini.

> **Nota:** Este projeto foi migrado de Vite para **Next.js 15**.

## ✨ Funcionalidades

### 🧠 Inteligência Artificial (Google Gemini)
- **Vozes Neurais (TTS):** Utiliza o modelo `gemini-2.5-flash-preview-tts` para gerar narrações com entonação emocional, pausas dramáticas e ritmo perfeito.
- **Storyboard AI:** O modelo `gemini-3-flash-preview` analisa o roteiro e o divide automaticamente em cenas granulares, criando prompts visuais detalhados.
- **Geração de Imagens:** Integração com `gemini-2.5-flash-image` (e Imagen) para criar visuais de alta fidelidade baseados nos prompts do storyboard.
- **Script Mágico:** Gerador de roteiros virais (estilo "O que aconteceria se...") otimizados para retenção de público.

### 🛠️ Estúdio de Produção
- **Visualizador de Áudio:** Waveform em tempo real sincronizado com a reprodução.
- **Editor & Storyboard:** Modos de visualização alternáveis para escrita livre ou planejamento cena a cena.
- **Exportação de Vídeo:** Renderização no navegador (Client-side) que une imagens e áudio em arquivos `.webm` verticais (9:16).
- **Consistência de Personagem:** Sistema de referência visual para manter o estilo e personagens consistentes entre as cenas.

### ☁️ Persistência & Backend (Supabase)
- **Autenticação:** Sistema de Login/Cadastro seguro via Supabase Auth.
- **Histórico de Projetos:** Salve e carregue seus roteiros e storyboards na nuvem.
- **Gerenciamento de Chaves API:** Armazenamento seguro e rotação de chaves de API do usuário.

## 🚀 Tecnologias Utilizadas

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- **Ícones:** Lucide React.
- **AI SDK:** `@google/genai` (Google GenAI SDK).
- **Backend/DB:** Supabase (Auth & PostgreSQL).
- **Áudio:** Web Audio API (Processamento PCM/WAV raw).
- **Vídeo:** Canvas API + MediaRecorder API.

## 📦 Configuração e Instalação

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Configurações do Supabase
NEXT_PUBLIC_SUPABASE_URL="https://sua-url-supabase.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anonima-supabase"

# Chave Padrão do Gemini (Opcional - usuários podem inserir a própria na UI)
NEXT_PUBLIC_GEMINI_API_KEY="sua-chave-google-genai"
```

### 3. Executar o Projeto

```bash
npm run dev
```
O projeto estará disponível em `http://localhost:9002`.

## 📖 Como Usar

## 🔑 Uso de APIs (Importante)

- **Este sistema não possui uma API paga padrão embutida.** Cada usuário deve configurar e manter suas próprias chaves de API.
- As chaves podem ser criadas no **Google AI Studio**: https://aistudio.google.com/api-keys
- Atualmente, no ecossistema do Google:
  - **Geração de texto e áudio** pode ser usada com planos gratuitos (respeitando limites e cotas da conta).
  - **Geração de imagens** normalmente exige uma conta/projeto com faturamento ativo (APIs pagas).
- **Resiliência recomendada:** configure **múltiplas chaves** para reduzir falhas por limite de cota, indisponibilidade temporária ou bloqueio de uma chave específica.
- **Roadmap de vídeo:** haverá suporte a APIs de geração de vídeo no futuro. No momento, essa parte ainda não foi implementada porque é necessário crédito ativo para testar e validar com segurança.

### Modo Editor
1. Digite ou cole sua história no editor de texto.
2. Use o botão **"Script Mágico"** para gerar uma ideia viral.
3. No painel lateral, escolha a **Voz** e o **Estilo**.
4. Clique em **"Gerar Narração"** para ouvir o resultado.

### Modo Storyboard
1. Clique em **"Gerar Storyboard"**. A IA dividirá seu texto em cenas.
2. Em cada cena, você pode gerar o áudio e a imagem individualmente.
3. **Referência Global:** Faça upload de uma imagem para servir de estilo base para as próximas gerações.

### Exportação
1. Quando todas as cenas tiverem imagem e áudio, o botão **"Exportar Vídeo"** ficará ativo.
2. O vídeo será renderizado em tempo real no seu navegador.

### Configuração sugerida de chaves
1. Gere suas chaves no Google AI Studio: https://aistudio.google.com/api-keys
2. Adicione uma chave principal na aplicação.
3. Se possível, cadastre chaves de backup (contas/projetos diferentes) para failover.
4. Monitore cotas e limites para evitar interrupções durante geração em lote.

## 📄 Licença

Este projeto é de código aberto. Sinta-se à vontade para contribuir!
