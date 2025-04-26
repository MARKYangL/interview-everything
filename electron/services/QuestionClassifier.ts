/**
 * 问题类型和返回结构
 */
export enum QuestionType {
  BEHAVIORAL = 'Behavioral Question',
  SYSTEM_DESIGN = 'System Design',
  OBJECT_ORIENTED_DESIGN = 'Object-Oriented Design',
  CODING = 'Coding Problem',
  UNKNOWN = 'Unknown'
}

/**
 * 分类问题类型的服务
 */
export class QuestionClassifier {
  // 关键词映射
  private readonly keywordMap = {
    [QuestionType.BEHAVIORAL]: [
      'tell me about a time',
      'describe a situation',
      'give me an example',
      'how did you handle',
      'what would you do if',
      'leadership',
      'challenge',
      'conflict',
      'mistake',
      'failure',
      'success',
      'team',
      'difficult',
      'proud',
      'disagreement'
    ],
    [QuestionType.SYSTEM_DESIGN]: [
      'design a system',
      'system architecture',
      'scalability',
      'distributed',
      'microservices',
      'database design',
      'how would you design',
      'architect',
      'scale',
      'throughput',
      'latency',
      'availability',
      'reliability'
    ],
    [QuestionType.OBJECT_ORIENTED_DESIGN]: [
      'object oriented',
      'class diagram',
      'inheritance',
      'polymorphism',
      'encapsulation',
      'abstraction',
      'design pattern',
      'singleton',
      'factory',
      'observer',
      'strategy'
    ],
    [QuestionType.CODING]: [
      'implement',
      'function',
      'algorithm',
      'complexity',
      'time complexity',
      'space complexity',
      'data structure',
      'array',
      'linked list',
      'tree',
      'graph',
      'hash table',
      'dynamic programming',
      'recursion',
      'iteration'
    ]
  };
  
  /**
   * 快速分类 - 基于关键词匹配
   */
  quickClassify(text: string): QuestionType {
    const lowerText = text.toLowerCase();
    
    // 计算各类型的匹配度
    const scores = Object.entries(this.keywordMap).map(([type, keywords]) => {
      const matchCount = keywords.reduce((count, keyword) => {
        return count + (lowerText.includes(keyword) ? 1 : 0);
      }, 0);
      
      return { type, score: matchCount };
    });
    
    // 找出得分最高的类型
    const bestMatch = scores.reduce((best, current) => {
      return current.score > best.score ? current : best;
    }, { type: QuestionType.UNKNOWN, score: 0 });
    
    // 如果没有匹配或得分太低，返回UNKNOWN
    return bestMatch.score > 0 ? bestMatch.type as QuestionType : QuestionType.UNKNOWN;
  }
  
  /**
   * 详细分类 - 可以使用更复杂的算法或外部API
   */
  async detailedClassify(text: string): Promise<QuestionType> {
    // 简单实现 - 仅使用快速分类
    // 在实际应用中，可以使用机器学习模型或调用OpenAI API进行更精确的分类
    return this.quickClassify(text);
  }
} 