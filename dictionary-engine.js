async function loadDictionary() {
    const response = await fetch("https://fidji-bucket.s3.eu-west-3.amazonaws.com/lexitrain-dictionary-10k.json");
    return await response.json();
}
