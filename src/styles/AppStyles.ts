import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1115',
    paddingTop: 0,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0f1115',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    color: '#e6e6e6',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  githubButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButton: {
    width: 21,
    height: 21,
    borderRadius: 13,
    backgroundColor: '#9aa3b2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpIcon: {
    fontSize: 16,
    color: '#0f1115',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#2a2f3a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#e6e6e6',
    backgroundColor: '#151821',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#9aa3b2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  downloadsContainer: {
    marginHorizontal: 16,
    borderRadius: 8,
  },
  downloadsList: {
    maxHeight: 180,
  },
  songsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1b1f2a',
    borderRadius: 6,
  },
  resultButtonDisabled: {
    opacity: 0.5,
  },
  resultButtonSelected: {
    backgroundColor: '#1b2a3f',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1115',
  },
  selectionCheckmark: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  resultTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  resultText: {
    fontSize: 16,
    color: '#e6e6e6',
  },
  resultSubtext: {
    marginTop: 2,
    fontSize: 12,
    color: '#9aa3b2',
  },
  downloadIndicator: {
    marginLeft: 8,
  },
  downloadedCheck: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4caf50',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#9aa3b2',
  },
  selectionToolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#151821',
    borderTopWidth: 1,
    borderTopColor: '#2a2f3a',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionToolbarText: {
    fontSize: 14,
    color: '#e6e6e6',
    fontWeight: '600',
  },
  selectionToolbarButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  toolbarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  toolbarButtonSecondary: {
    backgroundColor: '#666',
  },
  toolbarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  helpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpModalContent: {
    backgroundColor: '#1b1f2a',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: 400,
  },
  helpModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e6e6e6',
    marginBottom: 12,
  },
  helpModalText: {
    fontSize: 14,
    color: '#9aa3b2',
    lineHeight: 20,
    marginBottom: 20,
  },
  helpModalCloseButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  helpModalCloseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
