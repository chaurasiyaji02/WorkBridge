package com.workbridge.api.modules.workspace.service;

import com.workbridge.api.common.exception.ResourceNotFoundException;
import com.workbridge.api.common.exception.UnauthorizedException;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.auth.repository.UserRepository;
import com.workbridge.api.modules.project.entity.Project;
import com.workbridge.api.modules.project.repository.ProjectRepository;
import com.workbridge.api.modules.workspace.dto.DecisionDto;
import com.workbridge.api.modules.workspace.dto.MessageDto;
import com.workbridge.api.modules.workspace.entity.ChatMessage;
import com.workbridge.api.modules.workspace.entity.ProjectDecision;
import com.workbridge.api.modules.workspace.repository.ChatMessageRepository;
import com.workbridge.api.modules.workspace.repository.ProjectDecisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final ChatMessageRepository chatMessageRepository;
    private final ProjectDecisionRepository projectDecisionRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    // --- Chat Message Methods ---

    @Transactional
    public MessageDto.Response sendMessage(MessageDto.Request request, String userEmail) {
        User sender = getUserByEmail(userEmail);
        Project project = getProjectById(request.getProjectId());

        validateParticipant(project, sender);

        ChatMessage message = ChatMessage.builder()
                .project(project)
                .sender(sender)
                .content(request.getContent())
                .attachmentUrl(request.getAttachmentUrl())
                .isRead(false)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        return mapToMessageResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MessageDto.Response> getProjectMessages(Long projectId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Project project = getProjectById(projectId);

        validateParticipant(project, user);

        return chatMessageRepository.findAllByProjectIdOrderByCreatedAtAsc(projectId).stream()
                .map(this::mapToMessageResponse)
                .toList();
    }

    @Transactional
    public void markMessagesAsRead(Long projectId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Project project = getProjectById(projectId);

        validateParticipant(project, user);

        List<ChatMessage> unreadMessages = chatMessageRepository.findAllByProjectIdOrderByCreatedAtAsc(projectId).stream()
                .filter(m -> !m.getSender().getId().equals(user.getId()) && Boolean.FALSE.equals(m.getIsRead()))
                .peek(m -> m.setIsRead(true))
                .toList();

        chatMessageRepository.saveAll(unreadMessages);
    }

    // --- Decision Log Methods ---

    @Transactional
    public DecisionDto.Response recordDecision(DecisionDto.Request request, String userEmail) {
        User recorder = getUserByEmail(userEmail);
        Project project = getProjectById(request.getProjectId());

        validateParticipant(project, recorder);

        ProjectDecision decision = ProjectDecision.builder()
                .project(project)
                .recordedBy(recorder)
                .title(request.getTitle())
                .context(request.getResolvedContext())
                .outcome(request.getResolvedOutcome())
                .status(request.getStatus() != null ? request.getStatus() : "RECORDED")
                .build();

        ProjectDecision saved = projectDecisionRepository.save(decision);
        return mapToDecisionResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DecisionDto.Response> getProjectDecisions(Long projectId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Project project = getProjectById(projectId);

        validateParticipant(project, user);

        return projectDecisionRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::mapToDecisionResponse)
                .toList();
    }

    // --- Helper Methods ---

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Project getProjectById(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
    }

    private void validateParticipant(Project project, User user) {
        boolean isClient = project.getClient().getId().equals(user.getId());
        boolean isProvider = project.getAssignedProvider() != null && project.getAssignedProvider().getId().equals(user.getId());

        if (!isClient && !isProvider) {
            throw new UnauthorizedException("You do not have access to this workspace.");
        }
    }

    private MessageDto.Response mapToMessageResponse(ChatMessage message) {
        return MessageDto.Response.builder()
                .id(message.getId())
                .projectId(message.getProject().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .senderEmail(message.getSender().getEmail())
                .content(message.getContent())
                .attachmentUrl(message.getAttachmentUrl())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private DecisionDto.Response mapToDecisionResponse(ProjectDecision decision) {
        return DecisionDto.Response.builder()
                .id(decision.getId())
                .projectId(decision.getProject().getId())
                .projectTitle(decision.getProject().getTitle())
                .recordedById(decision.getRecordedBy().getId())
                .recordedByName(decision.getRecordedBy().getFullName())
                .title(decision.getTitle())
                .context(decision.getContext())
                .outcome(decision.getOutcome())
                .status(decision.getStatus())
                .createdAt(decision.getCreatedAt())
                .build();
    }
}