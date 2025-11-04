import { makeTransaction } from "../../domain/transaction.js";

export default function buildCreateTransaction({ repo }) {
  return async function createTransaction(input) {
    const tx = makeTransaction(input);
    return repo.create(tx);
  };
}

