import React, { useEffect, useState } from "react";
import { Tiktoken } from "js-tiktoken/lite";
import gpt2 from "js-tiktoken/ranks/gpt2";
import cl100k_base from "js-tiktoken/ranks/cl100k_base";
import o200k_base from "js-tiktoken/ranks/o200k_base";
import "./App.css";

export default function JaccardCalculator() {
  const [currentModel, setCurrentModel] = useState("gpt-4o");
  const [encoding, setEncoding] = useState(null);
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeTiktoken(currentModel);
  }, [currentModel]);

  useEffect(() => {
    if (text1.trim() && text2.trim() && encoding) {
      calculateSimilarity();
    } else {
      setResults(null);
    }
  }, [text1, text2, encoding]);

  const modelRanks = {
    gpt2: gpt2,
    "gpt-4": cl100k_base,
    "gpt-4o": o200k_base,
  };
  async function initializeTiktoken(model) {
    try {
      setLoading(true);
      const ranks = modelRanks[model];
      if (!ranks) throw new Error(`Unknown model: ${model}`);
      const enc = new Tiktoken(ranks);
      setEncoding(enc);
    } catch (err) {
      console.error(err);
      setError("Tokenizer initialization failed. Please reload the page.");
    } finally {
      setLoading(false);
    }
  }

  function simpleTokenize(text) {
    return text
      .toLowerCase()
      .replace(/([.!?])/g, " $1 ")
      .replace(/([,;:])/g, " $1 ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter((token) => token.length > 0);
  }

  function tokenizeText(text) {
    if (!encoding) return simpleTokenize(text);
    try {
      const tokens = encoding.encode(text);
      return tokens.map((token) => {
        try {
          return encoding.decode([token]);
        } catch {
          return `[${token}]`;
        }
      });
    } catch {
      return simpleTokenize(text);
    }
  }

  function calculateSimilarity() {
    const tokens1 = tokenizeText(text1);
    const tokens2 = tokenizeText(text2);
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    const similarity = union.size > 0 ? intersection.size / union.size : 0;
    setResults({
      tokens1,
      tokens2,
      intersection,
      set1,
      set2,
      union,
      similarity,
    });
  }

  function renderTokens(tokens, highlightSet) {
    const uniqueTokens = [...new Set(tokens)];
    return uniqueTokens.map((token, i) => (
      <span
        key={i}
        className={`token ${highlightSet?.has(token) ? "token-common" : ""}`}
      >
        {token}
      </span>
    ));
  }

  function showExample() {
    setText1("The quick brown fox jumps over the lazy dog.");
    setText2("A quick brown fox leaps over a lazy dog.");
    setError("");
  }

  return (
    <div className="container">
      <h1>Jaccard Similarity</h1>
      <p>
        The{" "}
        <a href="https://en.wikipedia.org/wiki/Jaccard_index">
          Jaccard similarity
        </a>{" "}
        measures the overlap between two sets:{" "}
        <code>J(A, B) = |A ∩ B| / |A ∪ B|</code>.
      </p>
      <p>
        This tool computes the Jaccard similarity between two texts by
        tokenizing them using OpenAI’s{" "}
        <a href="https://github.com/openai/tiktoken">
          <code>tiktoken</code>
        </a>
        .
      </p>

      <div className="button-container">
        <button
          className={currentModel === "gpt-4o" ? "tab active" : "tab"}
          onClick={() => setCurrentModel("gpt-4o")}
        >
          GPT-4o
        </button>
        <button
          className={currentModel === "gpt-4" ? "tab active" : "tab"}
          onClick={() => setCurrentModel("gpt-4")}
        >
          GPT-4
        </button>
        <button
          className={currentModel === "gpt2" ? "tab active" : "tab"}
          onClick={() => setCurrentModel("gpt2")}
        >
          GPT-2
        </button>
      </div>

      {/* Separate text areas */}
      <div className="split-input">
        <div>
          <textarea
            className="input-textarea"
            placeholder="Enter some text"
            value={text1}
            onChange={(e) => setText1(e.target.value)}
          />
        </div>
        <div>
          <textarea
            className="input-textarea"
            placeholder="Enter some text"
            value={text2}
            onChange={(e) => setText2(e.target.value)}
          />
        </div>
      </div>

      <div className="button-container">
        <button
          className="button"
          onClick={() => {
            setText1("");
            setText2("");
          }}
        >
          Clear
        </button>
        <button className="button" onClick={showExample}>
          Show example
        </button>
      </div>

      {loading && <div className="loading">Initializing tokenizer...</div>}
      {error && <div className="error-message">{error}</div>}

      {
        <div className="results-section show">
          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-label">Similarity</div>
              <div className="stat-value">
                {results ? results.similarity.toFixed(3) : "0.000"}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">|A &cap; B|</div>
              <div className="stat-value">
                {results ? results.intersection.size : 0}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">|A &cup; B|</div>
              <div className="stat-value">
                {results ? results.union.size : 0}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">|A|</div>
              <div className="stat-value">
                {results ? results.set1.size : 0}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">|B|</div>
              <div className="stat-value">
                {results ? results.set2.size : 0}
              </div>
            </div>
          </div>

          <div className="token-sections">
            <div className="tokens-container">
              {results && renderTokens(results.tokens1, results.intersection)}
            </div>
            <div className="tokens-container">
              {results && renderTokens(results.tokens2, results.intersection)}
            </div>
          </div>
        </div>
      }
      <footer className="footer">
        Inspired by{" "}
        <a href="https://platform.openai.com/tokenizer">OpenAI's tokenizer</a>.
        Created by <a href="https://github.com/speed1313">speed1313</a>. Code is
        available on <a href="https://github.com/speed1313/jaccard">GitHub</a>.
      </footer>
    </div>
  );
}
