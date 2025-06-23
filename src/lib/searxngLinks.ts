import axios from 'axios';
import { getSearxngApiEndpoint } from './config';
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import type { Embeddings } from '@langchain/core/embeddings';
import computeSimilarity from './utils/computeSimilarity';

interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
}

interface LinksSearchResult {
  order: number,
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
  embedds: number[];
}

interface MergedResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
  embedds: number[][];
}

const allowedSites = [
  "https://huggingface.co/PlanTL-GOB-ES/RoBERTalex",
  "https://huggingface.co/PlanTL-GOB-ES/gpt2-base-bne",
  "https://huggingface.co/PlanTL-GOB-ES/gpt2-large-bne",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-base-biomedical-clinical-es",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-base-biomedical-es",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-base-bne-capitel-ner-plus",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-base-bne-capitel-ner",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-base-bne-capitel-pos",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-base-bne-sqac",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-base-bne",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-base-ca",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-large-bne-capitel-ner",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-large-bne-capitel-pos",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-large-bne-sqac",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-large-bne",
  "https://huggingface.co/PlanTL-GOB-ES/bsc-bio-ehr-es-pharmaconer",
  "https://huggingface.co/PlanTL-GOB-ES/bsc-bio-ehr-es-cantemist",
  "https://huggingface.co/PlanTL-GOB-ES/bsc-bio-es",
  "https://huggingface.co/PlanTL-GOB-ES/bsc-bio-ehr-es",
  "https://huggingface.co/PlanTL-GOB-ES/longformer-base-4096-biomedical-clinical-es",
  "https://huggingface.co/PlanTL-GOB-ES/longformer-base-4096-bne-es",
  "https://huggingface.co/PlanTL-GOB-ES/es_pharmaconer_ner_trf",
  "https://huggingface.co/PlanTL-GOB-ES/es_cantemist_ner_trf",
  "https://huggingface.co/PlanTL-GOB-ES/es_bsc_demo_trf",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-base-es-wikicat-es",
  "https://huggingface.co/PlanTL-GOB-ES/mt-plantl-es-ca",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-large-bne-te",
  "https://huggingface.co/PlanTL-GOB-ES/mt-plantl-es-gl",
  "https://huggingface.co/PlanTL-GOB-ES/es_bsc_demo_md",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-large-bne-massive",
  "https://huggingface.co/PlanTL-GOB-ES/roberta-base-bne-mldoc",
  "https://huggingface.co/PlanTL-GOB-ES/ca_anonimization_core_lg",
  "https://huggingface.co/PlanTL-GOB-ES/es_anonimization_core_lg",
  "https://huggingface.co/PlanTL-GOB-ES/Controversy-Prediction",
  "https://huggingface.co/datasets/PlanTL-GOB-ES/SQAC",
  "https://huggingface.co/datasets/PlanTL-GOB-ES/cantemist-ner",
  "https://huggingface.co/datasets/PlanTL-GOB-ES/pharmaconer",
  "https://huggingface.co/datasets/PlanTL-GOB-ES/WikiCAT_en",
  "https://huggingface.co/datasets/PlanTL-GOB-ES/wnli-es",
  "https://huggingface.co/datasets/PlanTL-GOB-ES/UD_Spanish-AnCora",
  "https://huggingface.co/datasets/PlanTL-GOB-ES/CoNLL-NERC-es",
  "https://huggingface.co/datasets/PlanTL-GOB-ES/MLDoc",
  "https://huggingface.co/datasets/PlanTL-GOB-ES/sts-es",
  "https://huggingface.co/datasets/PlanTL-GOB-ES/WikiCAT_esv2",
  "https://huggingface.co/BSC-LT/RoBERTalex",
  "https://huggingface.co/BSC-LT/gpt2-large-bne",
  "https://huggingface.co/BSC-LT/roberta-base-biomedical-clinical-es",
  "https://huggingface.co/BSC-LT/roberta-base-biomedical-es",
  "https://huggingface.co/BSC-LT/roberta-base-bne-capitel-ner-plus",
  "https://huggingface.co/BSC-LT/roberta-base-bne-capitel-ner",
  "https://huggingface.co/BSC-LT/roberta-base-bne-capitel-pos",
  "https://huggingface.co/BSC-LT/roberta-base-bne-sqac",
  "https://huggingface.co/BSC-LT/roberta-base-bne",
  "https://huggingface.co/BSC-LT/roberta-base-ca",
  "https://huggingface.co/BSC-LT/roberta-large-bne-capitel-ner",
  "https://huggingface.co/BSC-LT/roberta-large-bne-capitel-pos",
  "https://huggingface.co/BSC-LT/roberta-large-bne-sqac",
  "https://huggingface.co/BSC-LT/roberta-large-bne",
  "https://huggingface.co/BSC-LT/sciroshot",
  "https://huggingface.co/BSC-LT/roberta_model_for_anonimization",
  "https://huggingface.co/BSC-LT/mdebertaCA",
  "https://huggingface.co/BSC-LT/NextProcurement_pdfutils",
  "https://huggingface.co/BSC-LT/vocos-mel-22khz",
  "https://huggingface.co/BSC-LT/sentis-matxa-tts-wavenext-multispeaker-ca",
  "https://huggingface.co/BSC-LT/wavenext-mel",
  "https://huggingface.co/BSC-LT/NextProcurement-NER-Spanish-UTE-Company",
  "https://huggingface.co/BSC-LT/experimental7b-rag",
  "https://huggingface.co/BSC-LT/experimental7b-rag-instruct",
  "https://huggingface.co/BSC-LT/salamandra7b_rag_prompt_ca-en-es",
  "https://huggingface.co/BSC-LT/wavenext-encodec",
  "https://huggingface.co/BSC-LT/Checkpoint_2b_instructed_beta",
  "https://huggingface.co/BSC-LT/checkpoint_2b_rag",
  "https://huggingface.co/BSC-LT/Flor-6.3B-Instruct",
  "https://huggingface.co/BSC-LT/Flor-6.3B-Instruct-4096",
  "https://huggingface.co/BSC-LT/Checkpoint_4epoch_rag",
  "https://huggingface.co/BSC-LT/salamandra-7b",
  "https://huggingface.co/BSC-LT/salamandra-7b-instruct",
  "https://huggingface.co/BSC-LT/salamandra-2b",
  "https://huggingface.co/BSC-LT/salamandra-2b-instruct",
  "https://huggingface.co/BSC-LT/salamandra-7b-instruct-fp8",
  "https://huggingface.co/BSC-LT/salamandra-2b-base-fp8",
  "https://huggingface.co/BSC-LT/salamandra-7b-base-fp8",
  "https://huggingface.co/BSC-LT/salamandra-7b-base-gptq",
  "https://huggingface.co/BSC-LT/salamandra-7b-instruct-gptq",
  "https://huggingface.co/BSC-LT/salamandra-2b-instruct-gptq",
  "https://huggingface.co/BSC-LT/salamandra-2b-base-gptq",
  "https://huggingface.co/BSC-LT/salamandra-2b-instruct-fp8",
  "https://huggingface.co/BSC-LT/salamandra-2b-instruct-aina-hack",
  "https://huggingface.co/BSC-LT/salamandra-7b-instruct-aina-hack",
  "https://huggingface.co/BSC-LT/ALIA-40b",
  "https://huggingface.co/BSC-LT/salamandraTA-7b-instruct",
  "https://huggingface.co/BSC-LT/ALIA-40b-instruct-nonpublic-gguf",
  "https://huggingface.co/BSC-LT/salamandraTA-7B-instruct-GGUF",
  "https://huggingface.co/BSC-LT/mRoBERTa",
  "https://huggingface.co/BSC-LT/RoBERTa-ca",
  "https://huggingface.co/BSC-LT/salamandraTA-2b-instruct",
  "https://huggingface.co/BSC-LT/salamandra-7b-vision",
  "https://huggingface.co/BSC-LT/salamandraTA-2B-instruct-GGUF",
  "https://huggingface.co/datasets/BSC-LT/open_data_26B_tokens_balanced_es_ca",
  "https://huggingface.co/datasets/BSC-LT/aguila7b-private-inference",
  "https://huggingface.co/datasets/BSC-LT/bsc-dolly-15k-en",
  "https://huggingface.co/datasets/BSC-LT/cabreu_dolly_summarization",
  "https://huggingface.co/datasets/BSC-LT/InstrucatQA",
  "https://huggingface.co/datasets/BSC-LT/NextProcurement-NER-Spanish-UTE-Company-annotated",
  "https://huggingface.co/datasets/BSC-LT/dataset-saver-space",
  "https://huggingface.co/datasets/BSC-LT/openbookqa-es",
  "https://huggingface.co/datasets/BSC-LT/COPA-es",
  "https://huggingface.co/datasets/BSC-LT/cobie_sst2",
  "https://huggingface.co/datasets/BSC-LT/cobie_ai2_arc",
  "https://huggingface.co/datasets/BSC-LT/hhh_alignment_es",
  "https://huggingface.co/datasets/BSC-LT/IFEval_es",
  "https://huggingface.co/datasets/BSC-LT/CAESAR-TV3",
  "https://huggingface.co/datasets/BSC-LT/EQ-bench_es",
  "https://huggingface.co/datasets/BSC-LT/EQ-bench_ca",
  "https://huggingface.co/projecte-aina/roberta-base-ca-cased-ner",
  "https://huggingface.co/projecte-aina/roberta-base-ca-cased-pos",
  "https://huggingface.co/projecte-aina/roberta-base-ca-cased-qa",
  "https://huggingface.co/projecte-aina/roberta-base-ca-cased-sts",
  "https://huggingface.co/projecte-aina/roberta-base-ca-cased-tc",
  "https://huggingface.co/projecte-aina/roberta-base-ca-cased-te",
  "https://huggingface.co/projecte-aina/roberta-base-ca-v2",
  "https://huggingface.co/projecte-aina/roberta-base-ca-v2-cased-ner",
  "https://huggingface.co/projecte-aina/roberta-base-ca-v2-cased-qa",
  "https://huggingface.co/projecte-aina/roberta-base-ca-v2-cased-te",
  "https://huggingface.co/projecte-aina/roberta-base-ca-v2-cased-tc",
  "https://huggingface.co/projecte-aina/roberta-base-ca-v2-cased-sts",
  "https://huggingface.co/projecte-aina/roberta-base-ca-v2-cased-pos",
  "https://huggingface.co/projecte-aina/roberta-large-ca-v2",
  "https://huggingface.co/projecte-aina/roberta-base-ca-v2-cased-wikicat-ca",
  "https://huggingface.co/projecte-aina/roberta-large-ca-paraphrase",
  "https://huggingface.co/projecte-aina/aina-translator-ca-es",
  "https://huggingface.co/projecte-aina/aina-translator-ca-en",
  "https://huggingface.co/projecte-aina/aina-translator-en-ca",
  "https://huggingface.co/projecte-aina/tts-ca-coqui-vits-multispeaker",
  "https://huggingface.co/projecte-aina/longformer-base-4096-ca-v2",
  "https://huggingface.co/projecte-aina/roberta-base-ca-v2-massive",
  "https://huggingface.co/projecte-aina/roberta-large-ca-v2-massive",
  "https://huggingface.co/projecte-aina/distilroberta-base-ca-v2",
  "https://huggingface.co/projecte-aina/roberta-base-ca-v2-cawikitc",
  "https://huggingface.co/projecte-aina/aguila-7b",
  "https://huggingface.co/projecte-aina/multiner_ceil",
  "https://huggingface.co/projecte-aina/FLOR-1.3B",
  "https://huggingface.co/projecte-aina/ST-NLI-ca_paraphrase-multilingual-mpnet-base",
  "https://huggingface.co/projecte-aina/aina-translator-ca-it",
  "https://huggingface.co/projecte-aina/aina-translator-it-ca",
  "https://huggingface.co/projecte-aina/aina-translator-eu-ca",
  "https://huggingface.co/projecte-aina/aina-translator-gl-ca",
  "https://huggingface.co/projecte-aina/aina-translator-ca-fr",
  "https://huggingface.co/projecte-aina/aina-translator-ca-pt",
  "https://huggingface.co/projecte-aina/aina-translator-pt-ca",
  "https://huggingface.co/projecte-aina/aina-translator-fr-ca",
  "https://huggingface.co/projecte-aina/aina-translator-ca-de",
  "https://huggingface.co/projecte-aina/aina-translator-de-ca",
  "https://huggingface.co/projecte-aina/FLOR-760M",
  "https://huggingface.co/projecte-aina/DEBERTA_CIEL",
  "https://huggingface.co/projecte-aina/FLOR-6.3B",
  "https://huggingface.co/projecte-aina/FLOR-6.3B-Instructed",
  "https://huggingface.co/projecte-aina/FLOR-1.3B-Instructed",
  "https://huggingface.co/projecte-aina/FlorQARAG",
  "https://huggingface.co/projecte-aina/aina-translator-es-ca",
  "https://huggingface.co/projecte-aina/Flor1.3RAG",
  "https://huggingface.co/projecte-aina/alvocat-vocos-22khz",
  "https://huggingface.co/projecte-aina/matxa-tts-cat-multispeaker",
  "https://huggingface.co/projecte-aina/FlorRAG",
  "https://huggingface.co/projecte-aina/RAGFlor1.3",
  "https://huggingface.co/projecte-aina/matxa-tts-cat-multiaccent",
  "https://huggingface.co/projecte-aina/Plume32k",
  "https://huggingface.co/projecte-aina/Plume128k",
  "https://huggingface.co/projecte-aina/Plume256k",
  "https://huggingface.co/projecte-aina/whisper-large-v3-ca-3catparla",
  "https://huggingface.co/projecte-aina/faster-whisper-large-v3-ca-3catparla",
  "https://huggingface.co/projecte-aina/aina-translator-es-oc",
  "https://huggingface.co/projecte-aina/aina-translator-es-an",
  "https://huggingface.co/projecte-aina/aina-translator-es-ast",
  "https://huggingface.co/projecte-aina/salamandra-7b-aligned-EADOP",
  "https://huggingface.co/projecte-aina/parakeet-rnnt-1.1b_cv17_es_ep18_1270h",
  "https://huggingface.co/projecte-aina/stt_ca-es_conformer_transducer_large",
  "https://huggingface.co/projecte-aina/whisper-large-v3-tiny-caesar",
  "https://huggingface.co/projecte-aina/aina-translator-zh-ca",
  "https://huggingface.co/projecte-aina/aina-translator-ca-zh",
  "https://huggingface.co/datasets/projecte-aina/parlament_parla",
  "https://huggingface.co/datasets/projecte-aina/ancora-ca-ner",
  "https://huggingface.co/datasets/projecte-aina/casum",
  "https://huggingface.co/datasets/projecte-aina/catalan_general_crawling",
  "https://huggingface.co/datasets/projecte-aina/catalan_government_crawling",
  "https://huggingface.co/datasets/projecte-aina/catalan_textual_corpus",
  "https://huggingface.co/datasets/projecte-aina/sts-ca",
  "https://huggingface.co/datasets/projecte-aina/teca",
  "https://huggingface.co/datasets/projecte-aina/tecla",
  "https://huggingface.co/datasets/projecte-aina/vilaquad",
  "https://huggingface.co/datasets/projecte-aina/vilasum",
  "https://huggingface.co/datasets/projecte-aina/viquiquad",
  "https://huggingface.co/datasets/projecte-aina/wnli-ca",
  "https://huggingface.co/datasets/projecte-aina/xquad-ca",
  "https://huggingface.co/datasets/projecte-aina/catalanqa",
  "https://huggingface.co/datasets/projecte-aina/WikiCAT_ca",
  "https://huggingface.co/datasets/projecte-aina/UD_Catalan-AnCora",
  "https://huggingface.co/datasets/projecte-aina/raco_forums",
  "https://huggingface.co/datasets/projecte-aina/Parafraseja",
  "https://huggingface.co/datasets/projecte-aina/GuiaCat",
  "https://huggingface.co/datasets/projecte-aina/xnli-ca",
  "https://huggingface.co/datasets/projecte-aina/CaWikiTC",
  "https://huggingface.co/datasets/projecte-aina/CaSET-catalan-stance-emotions-twitter",
  "https://huggingface.co/datasets/projecte-aina/CaSERa-catalan-stance-emotions-raco",
  "https://huggingface.co/datasets/projecte-aina/CaSSA-catalan-structured-sentiment-analysis",
  "https://huggingface.co/datasets/projecte-aina/COPA-ca",
  "https://huggingface.co/datasets/projecte-aina/ceil",
  "https://huggingface.co/datasets/projecte-aina/InToxiCat",
  "https://huggingface.co/datasets/projecte-aina/PAWS-ca",
  "https://huggingface.co/datasets/projecte-aina/caBreu",
  "https://huggingface.co/datasets/projecte-aina/CoQCat",
  "https://huggingface.co/datasets/projecte-aina/InstruCAT",
  "https://huggingface.co/datasets/projecte-aina/CA-PT_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/CA-FR_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/CA-DE_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/CA-IT_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/CA-EU_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/CA-GL_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/CATalog",
  "https://huggingface.co/datasets/projecte-aina/CA-ZH_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/CA-EN_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/openslr-slr69-ca-trimmed-denoised",
  "https://huggingface.co/datasets/projecte-aina/4catac",
  "https://huggingface.co/datasets/projecte-aina/festcat_trimmed_denoised",
  "https://huggingface.co/datasets/projecte-aina/escagleu-64k",
  "https://huggingface.co/datasets/projecte-aina/mgsm_ca",
  "https://huggingface.co/datasets/projecte-aina/commonvoice_benchmark_catalan_accents",
  "https://huggingface.co/datasets/projecte-aina/MentorES",
  "https://huggingface.co/datasets/projecte-aina/MentorCA",
  "https://huggingface.co/datasets/projecte-aina/openbookqa_ca",
  "https://huggingface.co/datasets/projecte-aina/NLUCat",
  "https://huggingface.co/datasets/projecte-aina/piqa_ca",
  "https://huggingface.co/datasets/projecte-aina/siqa_ca",
  "https://huggingface.co/datasets/projecte-aina/RAG_Multilingual",
  "https://huggingface.co/datasets/projecte-aina/xstorycloze_ca",
  "https://huggingface.co/datasets/projecte-aina/oasst1_ca",
  "https://huggingface.co/datasets/projecte-aina/arc_ca",
  "https://huggingface.co/datasets/projecte-aina/annotated_catalan_common_voice_v17",
  "https://huggingface.co/datasets/projecte-aina/LaFrescat",
  "https://huggingface.co/datasets/projecte-aina/dolly3k_ca",
  "https://huggingface.co/datasets/projecte-aina/corts_valencianes_asr_a",
  "https://huggingface.co/datasets/projecte-aina/parlament_parla_v3",
  "https://huggingface.co/datasets/projecte-aina/cv17_es_other_automatically_verified",
  "https://huggingface.co/datasets/projecte-aina/ES-AN_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/ES-AST_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/ES-OC_Parallel_Corpus",
  "https://huggingface.co/datasets/projecte-aina/synthetic_dem",
  "https://huggingface.co/datasets/projecte-aina/veritasQA",
  "https://huggingface.co/datasets/projecte-aina/IFEval_ca",
  "https://huggingface.co/datasets/projecte-aina/hhh_alignment_ca",
  ];

const existingUrls: Record<string, LinksSearchResult[] > = {};
function recursiveSplitText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 100,
  separators = ['\n\n\n', '\n\n', '\n', '. ', '.', ' ']
): string[] {
  const results: string[] = [];

  function splitRecursive(currentText: string, depth = 0) {
    if (currentText.length <= chunkSize || depth >= separators.length) {
      results.push(currentText.trim());
      return;
    }

    const sep = separators[depth];
    let pieces: string[];

    if (sep === '') {
      // Fallback: split by fixed size
      for (let i = 0; i < currentText.length; i += chunkSize - overlap) {
        results.push(currentText.slice(i, i + chunkSize).trim());
      }
      return;
    }

    pieces = currentText.split(sep);

    let currentChunk = '';
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i] + sep; // reattach separator
      if ((currentChunk + piece).length > chunkSize) {
        if (currentChunk) {
          splitRecursive(currentChunk.trim(), depth + 1);
        }
        currentChunk = piece;
      } else {
        currentChunk += piece;
      }
    }

    if (currentChunk) {
      splitRecursive(currentChunk.trim(), depth + 1);
    }
  }

  splitRecursive(text);
  return results;
}

function mergeByUrl(results: LinksSearchResult[]): MergedResult[] {
  const grouped: Record<string, LinksSearchResult[]> = {};

  // Group by URL
  for (const item of results) {
    if (!grouped[item.url]) grouped[item.url] = [];
    grouped[item.url].push(item);
  }

  // Merge each group
  const merged: MergedResult[] = Object.entries(grouped).map(([url, items]) => {
    const sorted = items.sort((a, b) => a.order - b.order);
    return {
      url,
      title: sorted[0].title,
      author: sorted[0].author,
      content: sorted.map(item => item.content).join('\n\n'),
      embedds: sorted.map(item => item.embedds),
    };
  });

  return merged;
}

export const fetchAsSearxngResults = async (
  urls: string[], embeddings: Embeddings, query:string
): Promise<MergedResult[]> => {
    const results: LinksSearchResult[][] = []
    for (const [i, url] of urls.entries()) {
      try {
        if (url in existingUrls){
          results.push(existingUrls[url]);
          continue;
        }
        console.log("Fetching:", i,  url);
        const { data: html } = await axios.get(url, { timeout: 60000 });
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        const content = article?.textContent
        console.log("Fethced", i, url);

        if (content){
          let splits: string[] = recursiveSplitText(content)

          const data = await Promise.all(splits.map(async (res, j) => {
            const embed = await embeddings.embedQuery(res);
            return {
              order: j, 
              title: article?.title || url,
              url,
              content: res,
              author: article?.byline || undefined,
              embedds: embed
            };
          }));
          existingUrls[url] = data
          // return existingUrls[url] 
          results.push(existingUrls[url])
        }
        console.log("Fethced", i, url);
        // return [{
        //     order: 0,
        //     title: article?.title || url,
        //     url,
        //     content: "",
        //     author: article?.byline || undefined,
        //     embedds: []
        // }];

      } catch (error) {
        if (error instanceof Error) {
          console.warn(`Failed to process ${url}: ${error.message}`);
        } else {
          console.warn(`Failed to process ${url}: Unknown error`, error);
        }
        // return [{
        //     order: 0,
        //     title: "",
        //     url,
        //     content: "",
        //     author: undefined,
        //     embedds: []
        // }];
      }
    }
  console.log("Finished fetching");
  
  let final_results: LinksSearchResult[] = results.flat()
  const queryEmbedding = await embeddings.embedQuery(query);
  
  const similarity = final_results.map((res, i) => {
      const sim = computeSimilarity(queryEmbedding, res.embedds);
      return {
        index: i,
        similarity: sim
      }
  });
  final_results = similarity
    .filter(
      (sim) => sim.similarity > 0.3,
    )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10)
    .map((sim) => final_results[sim.index]);
  
  return mergeByUrl(final_results)
  };

export const searchlinks = async (embeddings:Embeddings, question:string) => {
  const results: MergedResult[] = await fetchAsSearxngResults(allowedSites, embeddings, question);
  const suggestions: string[] = [];
  return { results, suggestions };
};
