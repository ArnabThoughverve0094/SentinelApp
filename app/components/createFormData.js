
const CreateFormData = (uri) => {
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  // const type = match ? `image/${match[1]}` : `image`;
  const type = Platform === "ios" ? 'png' : "image/png";

  const formData = new FormData();
  console.log("File Uri: ", uri);
  console.log("File Name: ", filename);
  console.log("File Type: ", type);
  formData.append('file', {
    uri,
    name: filename,
    type,
  });

  return formData;
};

export default CreateFormData;