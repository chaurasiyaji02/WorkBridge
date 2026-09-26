package com.workbridge.api.modules.resource.service;

import com.workbridge.api.common.exception.InvalidOperationException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService() {
        this.fileStorageLocation = Paths.get("uploads/resources").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new InvalidOperationException("Could not create directory for upload storage.");
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;

        try {
            if (uniqueFileName.contains("..")) {
                throw new InvalidOperationException("Invalid filename path sequence.");
            }

            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return targetLocation.toString();
        } catch (IOException ex) {
            throw new InvalidOperationException("Could not store file: " + originalFileName);
        }
    }

    public Resource loadFileAsResource(String filePath) {
        try {
            Path file = Paths.get(filePath).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new InvalidOperationException("File not found or unreadable.");
            }
        } catch (MalformedURLException ex) {
            throw new InvalidOperationException("File not found: " + filePath);
        }
    }

    public void deleteFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // Logged/ignored if already deleted
        }
    }
}