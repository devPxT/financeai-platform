export default function buildRemoveTransaction({ repo }) {
  return async function removeTransaction({ id }) {
    return repo.remove(id);
  };
}

