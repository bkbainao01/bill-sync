import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, VStack } from '@gluestack-ui/themed';
import { SLATE } from '@/theme/tokens';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: Props) {
  return (
    <VStack
      space="sm"
      alignItems="center"
      justifyContent="center"
      flex={1}
      style={{ paddingVertical: 48, paddingHorizontal: 24 }}
    >
      <Ionicons name={icon} size={48} color={SLATE} />
      <Text fontWeight="$bold" size="lg">
        {title}
      </Text>
      {description ? (
        <Text size="sm" color="$textLight400" textAlign="center">
          {description}
        </Text>
      ) : null}
    </VStack>
  );
}
