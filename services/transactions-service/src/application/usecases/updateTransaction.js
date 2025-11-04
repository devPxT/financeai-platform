export default function buildUpdateTransaction({ repo }) {
  return async function updateTransaction({ id, patch }) {
    return repo.update(id, patch);
  };
}

