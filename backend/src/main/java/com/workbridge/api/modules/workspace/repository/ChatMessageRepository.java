package com.workbridge.api.modules.workspace.repository;

import com.workbridge.api.modules.workspace.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findAllByProjectIdOrderByCreatedAtAsc(Long projectId);

    long countByProjectIdAndIsReadFalseAndSenderIdNot(Long projectId, Long senderId);
}