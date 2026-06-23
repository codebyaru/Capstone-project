/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { FunctionDeclaration, Type } from "@google/genai";

export interface MockJob {
  roleId: string;
  title: string;
  companyName: string;
  salaryOrRate: string;
  description: string;
  preferredSkills: string[];
}

export const CORE_JOBS_DATASET: MockJob[] = [
  {
    roleId: "gig-101",
    title: "Senior Node/TypeScript Architect (Scaling Backend)",
    companyName: "HyperSphere Logistics (YC W24)",
    salaryOrRate: "$110 - $145 / hr",
    description: "Looking for an expert backend engineer to migrate an Express server to a decoupled, event-driven architecture. Needs battle-tested knowledge of caching strategies, database query tuning (Postgres), and handling massive websockets throughput. Must write structured TypeScript.",
    preferredSkills: ["Node.js", "TypeScript", "PostgreSQL", "Express", "WebSockets", "Redis", "Event-driven architecture"]
  },
  {
    roleId: "gig-102",
    title: "Solidity & Smart Contract Auditor",
    companyName: "Inertia Labs (Web3 Audit Guild)",
    salaryOrRate: "$150k - $190k / year",
    description: "Urgently seeking a smart contract auditor who understands gas optimization trade-offs, reentrancy risk, and compiler level edge-cases. Strong security-first focus and ability to document findings in deep technical reports.",
    preferredSkills: ["Solidity", "Smart Contracts", "Security", "EVM", "Rust", "Foundry", "Hardhat"]
  },
  {
    roleId: "gig-103",
    title: "Lead Frontend Engineer (NextJS & Framer/Motion)",
    companyName: "Aether AI (Co-Pilot for Biotech)",
    salaryOrRate: "$120 - $160 / hr",
    description: "Building an interactive high-performance canvas dashboard for genomics researchers. Must be very proficient with React 19, Tailwind CSS, high-frame-rate canvas renderers, and micro-animations to guide research discovery flows. We appreciate detailed layout polish.",
    preferredSkills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Vite", "Canvas", "Framer Motion", "UI/UX"]
  },
  {
    roleId: "gig-104",
    title: "Cloud Infrastructure Specialist (ScyllaDB / Kubernetes)",
    companyName: "Pluto Compute",
    salaryOrRate: "$140 - $180 / hr",
    description: "Seeking a consultant architect to configure ScyllaDB clusters on AWS EKS. Must understand resource-isolation, Docker multi-stage builds, CI/CD pipelines, and high-availability setups under severe bandwidth throttles.",
    preferredSkills: ["Kubernetes", "AWS", "EKS", "ScyllaDB", "Docker", "DevOps", "CI/CD", "Linux"]
  },
  {
    roleId: "gig-105",
    title: "Full Stack Engineer (Gemini API / LLM Integrations)",
    companyName: "NextGen Concierge (B2B SaaS)",
    salaryOrRate: "$100 - $130 / hr",
    description: "Help us integrate conversational models under server-side Express/Node runtimes safely. Developing real-time transcription, multi-modal prompt management systems, and building responsive visual cards interface for end-users.",
    preferredSkills: ["React", "TypeScript", "Express", "Node.js", "Gemini API", "LLM", "Firebase", "WebSockets"]
  },
  {
    roleId: "gig-106",
    title: "E-Commerce Headless UI Architect",
    companyName: "HoloStore Retail (YC S23)",
    salaryOrRate: "$95 - $125 / hr",
    description: "Seeking an expert to optimize our multi-tenant headless shopping UI. We face progressive page-load delay penalties and need robust caching strategies, component modularity, and server-side pre-rendering utilizing clean Tailwind spacing.",
    preferredSkills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL", "Caching"]
  },
  {
    roleId: "gig-107",
    title: "High-Performance Systems Developer (Python/Rust)",
    companyName: "OmniQuantum Solutions",
    salaryOrRate: "$160k - $210k / year",
    description: "Designing a simulation builder that models molecular quantum configurations. We need an engineer with extensive experience profiling CPU memory allocations, implementing high-throughput safe threading, and designing clean programmatic APIs.",
    preferredSkills: ["Rust", "Python", "C++", "Docker", "Systems Programming", "Threading"]
  },
  {
    roleId: "gig-108",
    title: "HIPAA Compliant Pipeline Engineer",
    companyName: "BioFlow Systems",
    salaryOrRate: "$130 - $170 / hr",
    description: "Urgently building cloud-native health analytics ETL pipelines. Rigorous requirements for end-to-end encryption key management, audit-logging compliance schemes, and parsing unstructured clinical intake data sets.",
    preferredSkills: ["Python", "AWS", "Kubernetes", "Security", "ETL", "HIPAA", "PostgreSQL"]
  },
  {
    roleId: "gig-109",
    title: "Database High Availability Architect",
    companyName: "Veridical Finance Labs",
    salaryOrRate: "$150 - $190 / hr",
    description: "Architecting a multi-region PostgreSQL primary-replica synchronization topology under high write-load conditions. Candidate must specialize in concurrency control, isolating locking contentions, and live replication failovers.",
    preferredSkills: ["PostgreSQL", "Database Administration", "Redis", "AWS", "Infrastructure", "High Availability"]
  },
  {
    roleId: "gig-110",
    title: "Interactive Gameplay Platforms Engineer",
    companyName: "CyberZen Games",
    salaryOrRate: "$110 - $140 / hr",
    description: "Seeking a designer with advanced mastery of Framer Motion and WebGL canvases to craft high-fidelity, real-time interactive interactive layout interfaces for browser gaming leagues.",
    preferredSkills: ["React", "TypeScript", "Tailwind CSS", "Three.js", "Framer Motion", "Canvas", "WebGL"]
  },
  {
    roleId: "gig-111",
    title: "Machine Learning Systems Engineer",
    companyName: "NeuroFlow AI (YC W25)",
    salaryOrRate: "$130 - $165 / hr",
    description: "Looking for an expert to optimize training pipelines and deploy PyTorch/TensorFlow models on distributed GPU clusters. Experience with CUDA kernel optimization, model quantization, and caching inference results is highly desired.",
    preferredSkills: ["Python", "PyTorch", "Machine Learning", "CUDA", "TensorFlow", "Model Quantization", "GPU Clusters"]
  },
  {
    roleId: "gig-112",
    title: "AI Agent & NLP Developer",
    companyName: "Cognitive Auto (Autonomous SaaS)",
    salaryOrRate: "$120 - $155 / hr",
    description: "Seeking a developer to build advanced multi-agent workflows using LLM APIs. Experience with LangChain, vector databases (Pinecone/Milvus), prompt engineering, and fine-tuning lightweight models is required.",
    preferredSkills: ["Python", "NLP", "LangChain", "Vector Databases", "LLM", "Prompt Engineering", "Fine-tuning"]
  }
];

// MCP list_jobs tool definition
export const LIST_JOBS_TOOL: FunctionDeclaration = {
  name: "list_jobs",
  description: "Lists all available tech job openings, corporate roles, and freelancing gig matches in the database.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      preferredSkills: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Filter jobs requiring any of these specific technologies or skills."
      },
      limit: {
        type: Type.INTEGER,
        description: "Limit the number of returned results."
      }
    }
  }
};

// MCP get_job_details tool definition
export const GET_JOB_DETAILS_TOOL: FunctionDeclaration = {
  name: "get_job_details",
  description: "Retrieves complete metadata, description, compensation rates, and target skills for a specific role/gig by its ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      roleId: {
        type: Type.STRING,
        description: "The unique ID (e.g. gig-101, gig-102) of the job role."
      }
    },
    required: ["roleId"]
  }
};

export const mcpTools = [
  LIST_JOBS_TOOL,
  GET_JOB_DETAILS_TOOL
];

export function handleMcpCall(name: string, args: any): any {
  if (name === "list_jobs") {
    let result = CORE_JOBS_DATASET;
    if (args && args.preferredSkills && Array.isArray(args.preferredSkills)) {
      const skillsToFilter = args.preferredSkills.map((s: string) => s.toLowerCase());
      result = result.filter(job =>
        job.preferredSkills.some(skill => skillsToFilter.includes(skill.toLowerCase()))
      );
    }
    if (args && typeof args.limit === "number") {
      result = result.slice(0, args.limit);
    }
    return { success: true, count: result.length, jobs: result };
  } else if (name === "get_job_details") {
    const roleId = args?.roleId;
    const job = CORE_JOBS_DATASET.find(j => j.roleId === roleId);
    if (job) {
      return { success: true, job };
    }
    return { success: false, error: `Job with roleId '${roleId}' was not found.` };
  }
  throw new Error(`Unsupported MCP tool: ${name}`);
}
