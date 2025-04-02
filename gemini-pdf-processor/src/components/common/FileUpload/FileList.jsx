import React from "react";
import { Button, List, ListItem, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const FileList = ({ files, onFileChange, onRemoveFile }) => {
  return (
    <>
      <input
        type="file"
        onChange={onFileChange}
        accept=".pdf"
        style={{ display: "none" }}
        id="fileInput"
      />
      <label htmlFor="fileInput">
        <Button variant="contained" component="span" fullWidth>
          {files.length < 1 ? "Upload PDF" : "Upload More PDF"}
        </Button>
      </label>

      {files.length > 0 && (
        <List>
          {files.map((file, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton edge="end" onClick={() => onRemoveFile(index)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              {file.name}
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
};

export default FileList;
