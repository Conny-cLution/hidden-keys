This is a backend node server that returns a key.

# .env-file
The key and value pairs are stored in a .env-file.

It contains the ACCESS_TOKEN=token_to_include_in_fetch_header that must be included in the server request

Keys are listed one by one.

**It is important that the variable name starts with "KEY_" or "URL_".**

`KEY_NAME1=key1_value`

`URL_NAME1=url1_value`

# Fetch
```javascript
try {
  const url = `https://[server-address]/get-key?{type}={keyName}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer {ACCESS_TOKEN}',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  const duration = performance.now() - startTime;
} catch (error) {
  console.error(`Error fetching  ${type.toUpperCase()}: ${error}`);
}
```
