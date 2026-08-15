import { Pressable, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import type { Category } from '@/core/entities/category';

interface Props {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryChips({ categories, selectedId, onSelect }: Props) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {categories.map((c) => {
        const selected = c.id === selectedId;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: selected ? c.color : '#cbd5e1',
              backgroundColor: selected ? c.color : 'transparent',
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: selected ? '#ffffff' : c.color,
              }}
            />
            <Text
              size="sm"
              fontWeight={selected ? '$bold' : '$medium'}
              style={selected ? { color: '#ffffff' } : undefined}
            >
              {c.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
